import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiErrorType, AiFailureResult } from "@/lib/ai/errors";
import type { CandidateAiAnalysis, InterviewQuestion, ParsedResume, CandidateRecommendation } from "@/lib/types";

export interface CachedAiFailure {
  application_id: string;
  error_type: AiErrorType;
  message: string;
  retryable: boolean;
  created_at: string;
}

type AnalysisInsert = {
  application_id: string;
  parsed_resume: ParsedResume;
  match_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendation: CandidateRecommendation;
  reasoning: string;
};

/**
 * Data shape for saving a new candidate analysis (without application_id,
 * which is passed separately to saveCandidateAnalysis).
 */
export type SaveCandidateAnalysisInput = Omit<AnalysisInsert, "application_id">;

/**
 * Data shape for updating an existing candidate analysis (all fields optional).
 */
export type UpdateCandidateAnalysisInput = Partial<SaveCandidateAnalysisInput>;

export async function getCandidateAiAnalysis(
  supabase: SupabaseClient,
  applicationId: string
): Promise<CandidateAiAnalysis | null> {
  const { data, error } = await supabase
    .from("candidate_ai_analysis")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[InternIQ AI] getCandidateAiAnalysis:", error.message);
    return null;
  }

  return (data as CandidateAiAnalysis) ?? null;
}

export async function upsertCandidateAiAnalysis(
  supabase: SupabaseClient,
  row: AnalysisInsert
): Promise<CandidateAiAnalysis | null> {
  const { data, error } = await supabase
    .from("candidate_ai_analysis")
    .upsert(row, { onConflict: "application_id" })
    .select()
    .single();

  if (error) {
    console.error("[InternIQ AI] upsertCandidateAiAnalysis:", error.message);
    return null;
  }

  return data as CandidateAiAnalysis;
}

export async function getAiAnalysisFailure(
  supabase: SupabaseClient,
  applicationId: string
): Promise<CachedAiFailure | null> {
  const { data, error } = await supabase
    .from("candidate_ai_analysis_failures")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[InternIQ AI] getAiAnalysisFailure:", error.message);
    return null;
  }

  return (data as CachedAiFailure) ?? null;
}

export async function saveAiAnalysisFailure(
  supabase: SupabaseClient,
  applicationId: string,
  failure: AiFailureResult
): Promise<void> {
  const { error } = await supabase.from("candidate_ai_analysis_failures").upsert(
    {
      application_id: applicationId,
      error_type: failure.errorType,
      message: failure.message,
      retryable: failure.retryable,
    },
    { onConflict: "application_id" }
  );

  if (error) {
    console.error("[InternIQ AI] saveAiAnalysisFailure:", error.message);
  }
}

export async function clearAiAnalysisFailure(
  supabase: SupabaseClient,
  applicationId: string
): Promise<void> {
  const { error } = await supabase
    .from("candidate_ai_analysis_failures")
    .delete()
    .eq("application_id", applicationId);

  if (error) {
    console.error("[InternIQ AI] clearAiAnalysisFailure:", error.message);
  }
}

export async function deleteCandidateAiAnalysis(
  supabase: SupabaseClient,
  applicationId: string
): Promise<void> {
  const { error } = await supabase
    .from("candidate_ai_analysis")
    .delete()
    .eq("application_id", applicationId);

  if (error) {
    console.error("[InternIQ AI] deleteCandidateAiAnalysis:", error.message);
  }
}

/**
 * Retrieves a candidate analysis by application ID from the database.
 * Returns null if no analysis exists.
 * Never calls the AI provider.
 */
export async function getCandidateAnalysis(
  supabase: SupabaseClient,
  applicationId: string
): Promise<CandidateAiAnalysis | null> {
  return getCandidateAiAnalysis(supabase, applicationId);
}

/**
 * Saves a new candidate analysis to the database.
 * Uses upsert semantics — if an analysis already exists for this
 * application_id it will be replaced.
 */
export async function saveCandidateAnalysis(
  supabase: SupabaseClient,
  applicationId: string,
  data: SaveCandidateAnalysisInput
): Promise<CandidateAiAnalysis | null> {
  return upsertCandidateAiAnalysis(supabase, {
    application_id: applicationId,
    ...data,
  });
}

/**
 * Updates specific fields of an existing candidate analysis.
 * Only the provided fields are updated; the rest remain unchanged.
 */
// export async function updateCandidateAnalysis(
//   supabase: SupabaseClient,
//   applicationId: string,
//   data: UpdateCandidateAnalysisInput
// ): Promise<CandidateAiAnalysis | null> {
//   const { data: result, error } = await supabase
//     .from("candidate_ai_analysis")
//     .update(data)
//     .eq("application_id", applicationId)
//     .select()
//     .single();

//   if (error) {
//     console.error("[InternIQ AI] updateCandidateAnalysis:", error.message);
//     return null;
//   }

//   return result as CandidateAiAnalysis;
// }

/**
 * Retrieves stored interview questions for an application from the database.
 * Returns null if no questions exist.
 * Never calls the AI provider.
 */
export async function getInterviewQuestions(
  supabase: SupabaseClient,
  applicationId: string
): Promise<InterviewQuestion[] | null> {
  const { data, error } = await supabase
    .from("candidate_ai_analysis")
    .select("interview_questions")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data?.interview_questions) {
    return null;
  }

  return data.interview_questions as InterviewQuestion[];
}

/**
 * Saves (replaces) interview questions for an application.
 * Uses the application_id to upsert on the existing candidate_ai_analysis row.
 * Never calls the AI provider.
 */
export async function saveInterviewQuestions(
  supabase: SupabaseClient,
  applicationId: string,
  questions: InterviewQuestion[]
): Promise<boolean> {
  const { error } = await supabase
    .from("candidate_ai_analysis")
    .update({ interview_questions: questions })
    .eq("application_id", applicationId);

  if (error) {
    console.error("[InternIQ AI] saveInterviewQuestions:", error.message);
    return false;
  }

  return true;
}

/**
 * Deletes stored interview questions for an application.
 * Used before regeneration to clear the cache.
 */
export async function deleteInterviewQuestions(
  supabase: SupabaseClient,
  applicationId: string
): Promise<void> {
  const { error } = await supabase
    .from("candidate_ai_analysis")
    .update({ interview_questions: null })
    .eq("application_id", applicationId);

  if (error) {
    console.error("[InternIQ AI] deleteInterviewQuestions:", error.message);
  }
}