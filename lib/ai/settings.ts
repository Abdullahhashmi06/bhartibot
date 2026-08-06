import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendationWeights } from "@/lib/types";

/**
 * Configurable recommendation-engine weights.
 *
 * The engine reads its weights from the `recommendation_settings` table on
 * every request (with a short in-memory TTL to keep things fast). Changing a
 * weight — or bumping the `version` column — instantly affects future
 * recommendations without any code change. Because the settings `version` is
 * part of the recommendation signal hash, cached rows are automatically
 * invalidated when weights change.
 *
 * Defaults mirror the seed row in the migration and are used only when the
 * table is unreachable (migration not yet applied, RLS hiccup, etc.).
 */
export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  required_skills_weight: 40,
  preferred_skills_weight: 15,
  education_weight: 12,
  experience_weight: 8,
  project_weight: 10,
  profile_weight: 5,
  competition_weight: 6,
  recency_weight: 4,
  algorithm_version: "v2",
  cache_version: 2,
  version: 1,
};

const SETTINGS_TTL_MS = 60_000;
const settingsCache = new Map<
  string,
  { weights: RecommendationWeights; loadedAt: number }
>();

/**
 * Loads the current recommendation weights from the database, caching them
 * in-memory for up to 60 seconds to avoid hammering the DB on every request.
 * Falls back to DEFAULT_RECOMMENDATION_WEIGHTS when the table is missing.
 */
export async function getRecommendationWeights(
  supabase: SupabaseClient
): Promise<RecommendationWeights> {
  const now = Date.now();
  const cached = settingsCache.get("global");
  if (cached && now - cached.loadedAt < SETTINGS_TTL_MS) {
    return cached.weights;
  }

  const { data, error } = await supabase
    .from("recommendation_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.warn(
        "[InternIQ AI] recommendation_settings unavailable, using defaults:",
        error.message
      );
    }
    settingsCache.set("global", {
      weights: DEFAULT_RECOMMENDATION_WEIGHTS,
      loadedAt: now,
    });
    return DEFAULT_RECOMMENDATION_WEIGHTS;
  }

  const weights: RecommendationWeights = {
    required_skills_weight: Number(data.required_skills_weight ?? 40),
    preferred_skills_weight: Number(data.preferred_skills_weight ?? 15),
    education_weight: Number(data.education_weight ?? 12),
    experience_weight: Number(data.experience_weight ?? 8),
    project_weight: Number(data.project_weight ?? 10),
    profile_weight: Number(data.profile_weight ?? 5),
    competition_weight: Number(data.competition_weight ?? 6),
    recency_weight: Number(data.recency_weight ?? 4),
    algorithm_version: data.algorithm_version || "v2",
    cache_version: data.cache_version ?? 2,
    version: data.version ?? 1,
  };

  settingsCache.set("global", { weights, loadedAt: now });
  return weights;
}

/** Sum of the 8 scoring weights (used to normalize to 0–100). */
export function totalWeight(weights: RecommendationWeights): number {
  return (
    weights.required_skills_weight +
    weights.preferred_skills_weight +
    weights.education_weight +
    weights.experience_weight +
    weights.project_weight +
    weights.profile_weight +
    weights.competition_weight +
    weights.recency_weight
  );
}

/** Serializable snapshot of the numeric weights (stored per recommendation row). */
export function weightsSnapshot(
  weights: RecommendationWeights
): Record<string, number> {
  return {
    required_skills_weight: weights.required_skills_weight,
    preferred_skills_weight: weights.preferred_skills_weight,
    education_weight: weights.education_weight,
    experience_weight: weights.experience_weight,
    project_weight: weights.project_weight,
    profile_weight: weights.profile_weight,
    competition_weight: weights.competition_weight,
    recency_weight: weights.recency_weight,
  };
}
