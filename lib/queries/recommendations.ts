import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ApplicantRecommendation,
  SkillGap,
} from "@/lib/types";

export interface SaveRecommendationInput {
  applicant_id: string;
  internship_id: string;
  match_score: number;
  explanation: string;
  matched_skills: string[];
  missing_skills: string[];
  signal_hash: string;
  // ── v2 analytics columns ──
  acceptance_probability: number;
  overall_score: number;
  skill_gaps: SkillGap[];
  strengths: string[];
  weaknesses: string[];
  competition_level: string;
  avg_applicant_match: number | null;
  reason_generated: "ai" | "computed" | "cache";
  algorithm_version: string;
  cache_version: number;
  weights_snapshot: Record<string, number> | null;
  profile_completeness: number;
}

/** All cached recommendations for one applicant, keyed for quick lookup. */
export async function getCachedRecommendations(
  supabase: SupabaseClient,
  applicantId: string
): Promise<ApplicantRecommendation[]> {
  const { data, error } = await supabase
    .from("applicant_recommendations")
    .select("*")
    .eq("applicant_id", applicantId);

  if (error) {
    console.error("[InternIQ AI] getApplicantRecommendations:", error.message);
    return [];
  }
  return (data as ApplicantRecommendation[]) ?? [];
}

/** Bulk upsert recommendation rows (unique on applicant_id + internship_id). */
export async function upsertApplicantRecommendations(
  supabase: SupabaseClient,
  rows: SaveRecommendationInput[]
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("applicant_recommendations")
    .upsert(rows, { onConflict: "applicant_id,internship_id" });

  if (error) {
    console.error("[InternIQ AI] upsertApplicantRecommendations:", error.message);
  }
}

/** Invalidate the cache when the applicant profile/skills change. */
export async function clearApplicantRecommendations(
  supabase: SupabaseClient,
  applicantId: string
): Promise<void> {
  const { error } = await supabase
    .from("applicant_recommendations")
    .delete()
    .eq("applicant_id", applicantId);

  if (error) {
    console.error("[InternIQ AI] clearApplicantRecommendations:", error.message);
  }
}

/** Stale recommendations (signal hash mismatch) are deleted on refresh. */
export async function deleteStaleRecommendations(
  supabase: SupabaseClient,
  applicantId: string,
  freshHashes: { internship_id: string; signal_hash: string }[]
): Promise<void> {
  if (freshHashes.length === 0) {
    await clearApplicantRecommendations(supabase, applicantId);
    return;
  }

  // Build a filter: delete rows where (applicant_id matches) AND NOT in the
  // fresh set. Supabase supports or() filters, so we delete all rows whose
  // internship_id is NOT in the fresh list.
  const keepIds = freshHashes.map((h) => h.internship_id);
  if (keepIds.length > 0) {
    const { error } = await supabase
      .from("applicant_recommendations")
      .delete()
      .eq("applicant_id", applicantId)
      .not("internship_id", "in", `(${keepIds.join(",")})`);

    if (error) {
      console.error("[InternIQ AI] deleteStaleRecommendations:", error.message);
    }
  } else {
    await clearApplicantRecommendations(supabase, applicantId);
  }
}
