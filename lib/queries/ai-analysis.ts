import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiErrorType, AiFailureResult } from "@/lib/ai/errors";
import type { CandidateAiAnalysis, ParsedResume, CandidateRecommendation } from "@/lib/types";

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
