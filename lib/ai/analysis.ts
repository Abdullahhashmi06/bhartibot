import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { extractTextFromPdf } from "@/lib/ai/pdf";
import { parseResumeText } from "@/lib/ai/resume-parser";
import { scoreCandidate } from "@/lib/ai/scoring";
import { generateRecruiterNotes } from "@/lib/ai/recruiter-notes";
import { runAiOperation } from "@/lib/ai/service";
import { AiError, type AiFailureResult, type AiServiceResult } from "@/lib/ai/errors";
import { downloadCvBuffer } from "@/lib/queries/storage";
import {
  clearAiAnalysisFailure,
  getAiAnalysisFailure,
  getCandidateAiAnalysis,
  saveAiAnalysisFailure,
  upsertCandidateAiAnalysis,
} from "@/lib/queries/ai-analysis";
import type {
  Application,
  CandidateAiAnalysis,
  Internship,
  Requirement,
} from "@/lib/types";

export type RunAnalysisInput = {
  supabase: SupabaseClient;
  application: Application;
  internship: Internship;
  requirements: Requirement[];
  screeningAnswers: { question: string; answer: string }[];
  /** When true, bypass cached failure and re-run Gemini (recruiter action). */
  force?: boolean;
};

export type AnalysisViewState =
  | { kind: "success"; analysis: CandidateAiAnalysis }
  | { kind: "failure"; failure: AiFailureResult }
  | { kind: "empty" };

/** Load cached success or failure from the database only — no Gemini calls. */
export async function loadAnalysisViewState(
  supabase: SupabaseClient,
  applicationId: string
): Promise<AnalysisViewState> {
  const existing = await getCandidateAiAnalysis(supabase, applicationId);
  if (existing) {
    return { kind: "success", analysis: existing };
  }

  const failure = await getAiAnalysisFailure(supabase, applicationId);
  if (failure) {
    return {
      kind: "failure",
      failure: {
        success: false,
        errorType: failure.error_type,
        message: failure.message,
        retryable: failure.retryable,
      },
    };
  }

  return { kind: "empty" };
}

export type EnsureAnalysisInput = RunAnalysisInput;

/**
 * Step 5 + 9: Load cached analysis from DB, or auto-run the pipeline once when
 * none exists. Never calls Gemini if a successful analysis is already stored.
 */
export async function ensureCandidateAnalysis(
  input: EnsureAnalysisInput
): Promise<AnalysisViewState> {
  const { supabase, application } = input;
  const cached = await loadAnalysisViewState(supabase, application.id);

  if (cached.kind !== "empty") {
    return cached;
  }

  if (!application.cv_path) {
    return { kind: "empty" };
  }

  const result = await runCandidateAnalysis({ ...input, force: false });

  if (result.success) {
    return { kind: "success", analysis: result.data };
  }

  return { kind: "failure", failure: result };
}

/**
 * Runs the full CV analysis pipeline when allowed.
 * Step 5: called automatically on applicant page open when no analysis exists.
 * Skips Gemini if a successful analysis already exists (loads from DB).
 * Skips auto-retry when a failure is cached unless force=true.
 */
export async function runCandidateAnalysis(
  input: RunAnalysisInput
): Promise<AiServiceResult<CandidateAiAnalysis>> {
  const { supabase, application, force } = input;

  const existing = await getCandidateAiAnalysis(supabase, application.id);
  if (existing && !force) {
    return { success: true, data: existing };
  }

  if (!force) {
    const cachedFailure = await getAiAnalysisFailure(supabase, application.id);
    if (cachedFailure) {
      return {
        success: false,
        errorType: cachedFailure.error_type,
        message: cachedFailure.message,
        retryable: cachedFailure.retryable,
      };
    }
  }

  if (!application.cv_path) {
    const failure: AiFailureResult = {
      success: false,
      errorType: "NO_CV",
      message: "No CV was uploaded for this applicant.",
      retryable: false,
    };
    await saveAiAnalysisFailure(supabase, application.id, failure);
    return failure;
  }

  const result = await runAiOperation("runCandidateAnalysis", async () => {
    const pdfBuffer = await downloadCvBuffer(supabase, application.cv_path!);
    const resumeText = await extractTextFromPdf(pdfBuffer);
    const parsedResume = await parseResumeText(resumeText);
    const score = await scoreCandidate({
      parsedResume,
      internship: input.internship,
      requirements: input.requirements,
      screeningAnswers: input.screeningAnswers,
    });

    const saved = await upsertCandidateAiAnalysis(supabase, {
      application_id: application.id,
      parsed_resume: parsedResume,
      match_score: score.match_score,
      strengths: score.strengths,
      weaknesses: score.weaknesses,
      missing_skills: score.missing_skills,
      recommendation: score.recommendation,
      reasoning: score.reasoning,
    });

    if (!saved) {
      throw new AiError("UNKNOWN", "Failed to save AI analysis to database.");
    }

    await clearAiAnalysisFailure(supabase, application.id);

    // Generate recruiter notes in the background — non-blocking.
    let recruiter_notes = "";
    try {
      recruiter_notes = await generateRecruiterNotes({
        parsedResume,
        internship: input.internship,
        requirements: input.requirements,
        screeningAnswers: input.screeningAnswers,
      });
    } catch {
      // Non-critical — UI will show an empty state.
    }

    // Attach enhanced AI output fields to the returned object.
    // These are not persisted in the DB but are available for the UI.
    return {
      ...saved,
      candidate_summary: score.candidate_summary,
      strengths_summary: score.strengths_summary,
      risks_summary: score.risks_summary,
      strength_summary: score.strength_summary,
      risk_summary: score.risk_summary,
      overall_explanation: score.overall_explanation,
      technical_reason: score.technical_reason,
      education_reason: score.education_reason,
      experience_reason: score.experience_reason,
      communication_reason: score.communication_reason,
      culture_reason: score.culture_reason,
      recruiter_notes,
    };
  });

  if (!result.success) {
    await saveAiAnalysisFailure(supabase, application.id, result);
  }

  return result;
}
