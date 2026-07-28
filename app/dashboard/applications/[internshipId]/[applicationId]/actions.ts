"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runCandidateAnalysis } from "@/lib/ai/analysis";
import type { AiFailureResult } from "@/lib/ai/errors";
import {
  clearAiAnalysisFailure,
  deleteCandidateAiAnalysis,
} from "@/lib/queries/ai-analysis";
import {
  getApplicationAnswers,
  getApplicationById,
} from "@/lib/queries/applications";
import { getInternshipRequirements } from "@/lib/queries/internships";
import { createClient } from "@/lib/supabase/server";
import type { CandidateAiAnalysis } from "@/lib/types";

export type ReanalyzeActionResult =
  | { success: true; analysis: CandidateAiAnalysis }
  | { success: false; failure: AiFailureResult };

export async function reanalyzeApplicantCv(
  internshipId: string,
  applicationId: string,
  force: boolean
): Promise<ReanalyzeActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const application = await getApplicationById(supabase, applicationId);
  if (!application || application.internship_id !== internshipId) {
    return {
      success: false,
      failure: {
        success: false,
        errorType: "UNKNOWN",
        message: "Application not found.",
        retryable: false,
      },
    };
  }

  if (force) {
    await Promise.all([
      deleteCandidateAiAnalysis(supabase, applicationId),
      clearAiAnalysisFailure(supabase, applicationId),
    ]);
  }

  const { data: internship, error: internshipError } = await supabase
    .from("internships")
    .select("*")
    .eq("id", internshipId)
    .single();

  if (internshipError || !internship) {
    return {
      success: false,
      failure: {
        success: false,
        errorType: "UNKNOWN",
        message: "Internship not found.",
        retryable: false,
      },
    };
  }

  const [requirements, screeningAnswers] = await Promise.all([
    getInternshipRequirements(supabase, internshipId),
    getApplicationAnswers(supabase, applicationId),
  ]);

  const result = await runCandidateAnalysis({
    supabase,
    application,
    internship,
    requirements,
    screeningAnswers,
    force,
  });

  revalidatePath(
    `/dashboard/applications/${internshipId}/${applicationId}`
  );

  if (result.success) {
    return { success: true, analysis: result.data };
  }

  return { success: false, failure: result };
}
