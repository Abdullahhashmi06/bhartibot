import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { runAiOperation } from "@/lib/ai/service";
import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildRecommendationPrompt,
  parseJsonFromModelText,
  RECOMMENDATION_SYSTEM,
} from "@/lib/ai/prompts";
import {
  buildApplicantSkillList,
  computeRecommendationScore,
  type RecommendationScoreOutput,
} from "@/lib/ai/match";
import {
  getRecommendationWeights,
  weightsSnapshot,
} from "@/lib/ai/settings";
import {
  deleteStaleRecommendations,
  getCachedRecommendations,
  upsertApplicantRecommendations,
} from "@/lib/queries/recommendations";
import type {
  ApplicantFeedItem,
  ApplicantRecommendation,
  CompetitionIntelligence,
  RecommendationWeights,
  SkillGap,
} from "@/lib/types";

export interface ApplicantProfileBundle {
  full_name: string | null;
  degree: string | null;
  university: string | null;
  bio: string | null;
  cgpa?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  cv_path?: string | null;
}

/** In-flight dedup: concurrent uncached loads share one AI generation. */
const inflight = new Map<string, Promise<unknown>>();

export interface RecommendationResult extends ApplicantFeedItem {
  matchScore: number;
  acceptanceProbability: number;
  overallScore: number;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
  strengths: string[];
  weaknesses: string[];
  competitionIntelligence: CompetitionIntelligence;
  profileCompleteness: number;
  /** True when the explanation came from the AI provider (not deterministic fallback). */
  aiGenerated: boolean;
  /** Where this row's data came from on this load. */
  reasonGenerated: "ai" | "computed" | "cache";
}

/**
 * Deterministic signal hash for a (applicant, internship) pair.
 * Any change to the applicant's skills/profile, the internship's
 * requirements/description, the engine weights, or the cache version produces
 * a different hash, so cached recommendations are recomputed exactly when they
 * should be (Part 9 — automatic refresh, no manual invalidation).
 */
function signalHash(
  applicantBundle: ApplicantProfileBundle,
  applicantSkills: string[],
  projectTitles: string[],
  experienceText: string[],
  item: ApplicantFeedItem,
  weights: RecommendationWeights
): string {
  const source = JSON.stringify([
    weights.cache_version,
    weights.version,
    weights.algorithm_version,
    applicantBundle.degree,
    applicantBundle.university,
    applicantBundle.bio,
    applicantBundle.cgpa ?? "",
    applicantBundle.linkedin_url ?? "",
    applicantBundle.github_url ?? "",
    applicantBundle.portfolio_url ?? "",
    applicantBundle.cv_path ?? "",
    [...applicantSkills].sort(),
    [...projectTitles].sort(),
    [...experienceText].sort(),
    item.id,
    item.title,
    item.field,
    item.description,
    item.stipend,
    item.deadline,
    item.applicant_count,
    item.avg_applicant_match ?? "",
    [...(item.required_skills ?? [])].sort(),
    [...(item.preferred_skills ?? [])].sort(),
  ]);
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}`;
}

interface RecommendationRow {
  internshipId: string;
  score: RecommendationScoreOutput;
  hash: string;
}

/**
 * Generates batched AI explanations for the top matches, then returns an
 * updated map. Never throws — on AI failure, deterministic reasoning remains.
 */
async function enrichWithAiExplanations(
  bundle: ApplicantProfileBundle,
  applicantSkills: string[],
  projects: { title?: string }[],
  experience: { role?: string; company?: string }[],
  feed: ApplicantFeedItem[],
  rows: RecommendationRow[]
): Promise<Map<string, string>> {
  const sorted = [...rows].sort(
    (a, b) => b.score.overallScore - a.score.overallScore
  );
  const top = sorted.slice(0, 6);

  if (top.length === 0) return new Map();

  const result = await runAiOperation("applicantRecommendations", async () => {
    const raw = await generateJson(
      buildRecommendationPrompt({
        studentName: bundle.full_name || "Student",
        degree: bundle.degree || "",
        university: bundle.university || "",
        skills: applicantSkills,
        projects: (projects || []).map((p) => p.title || "").filter(Boolean),
        experience: (experience || [])
          .map((e) => [e.role, e.company].filter(Boolean).join(" @ "))
          .filter(Boolean),
        internships: top.map((row) => {
          const item = feed.find((f) => f.id === row.internshipId)!;
          return {
            id: item.id,
            title: item.title,
            field: item.field,
            company: item.company_name,
            description: item.description,
            requiredSkills: item.required_skills,
            preferredSkills: item.preferred_skills,
            matchedSkills: row.score.matchedSkills,
            missingSkills: row.score.missingSkills,
            matchScore: row.score.matchScore,
            acceptanceProbability: row.score.acceptanceProbability,
            competitionLabel: row.score.competition.label,
            applicantCount: row.score.competition.count,
            strengths: row.score.strengths,
            weaknesses: row.score.weaknesses,
          };
        }),
      }),
      { systemInstruction: RECOMMENDATION_SYSTEM }
    );

    const parsed = parseJsonFromModelText<{
      explanations?: { internship_id?: string; explanation?: string }[];
    }>(raw);

    const map = new Map<string, string>();
    (parsed.explanations ?? []).forEach((e) => {
      if (e.internship_id && e.explanation) {
        map.set(e.internship_id, e.explanation.trim());
      }
    });
    return map;
  });

  if (!result.success) {
    console.warn(
      "[InternIQ AI] recommendation explanations unavailable, using deterministic reasoning:",
      result.errorType
    );
    return new Map();
  }

  // Return only the internships that actually received an AI explanation.
  // Persisting happens in the single write path in getApplicantRecommendations.
  const updated = new Map<string, string>();
  top.forEach((row) => {
    const explanation = result.data.get(row.internshipId);
    if (explanation) updated.set(row.internshipId, explanation);
  });
  return updated;
}

/** Builds a RecommendationResult from either a fresh score or a cached row. */
function toResult(
  item: ApplicantFeedItem,
  score: RecommendationScoreOutput,
  explanation: string,
  aiGenerated: boolean,
  reasonGenerated: "ai" | "computed" | "cache"
): RecommendationResult {
  return {
    ...item,
    matchScore: score.matchScore,
    acceptanceProbability: score.acceptanceProbability,
    overallScore: score.overallScore,
    explanation,
    matchedSkills: score.matchedSkills,
    missingSkills: score.missingSkills,
    skillGaps: score.skillGaps,
    strengths: score.strengths,
    weaknesses: score.weaknesses,
    competitionIntelligence: score.competition,
    profileCompleteness: score.profileCompleteness,
    aiGenerated,
    reasonGenerated,
  };
}

/** Restores a full RecommendationResult from a cached row + feed item. */
function fromCached(
  item: ApplicantFeedItem,
  cachedRow: ApplicantRecommendation
): RecommendationResult {
  const competition: CompetitionIntelligence = {
    count: item.applicant_count,
    label: cachedRow.competition_level || "Moderate Competition",
    tone:
      item.applicant_count <= 10
        ? "emerald"
        : item.applicant_count <= 30
        ? "amber"
        : "rose",
    dot: item.applicant_count <= 10 ? "🟢" : item.applicant_count <= 30 ? "🟡" : "🔴",
    estimatedDifficulty:
      item.applicant_count <= 10
        ? "Low"
        : item.applicant_count <= 30
        ? "Moderate"
        : "High",
    avgApplicantMatch: cachedRow.avg_applicant_match ?? item.avg_applicant_match,
  };
  return {
    ...item,
    matchScore: cachedRow.match_score,
    acceptanceProbability: cachedRow.acceptance_probability,
    overallScore: cachedRow.overall_score,
    explanation: cachedRow.explanation,
    matchedSkills: cachedRow.matched_skills,
    missingSkills: cachedRow.missing_skills,
    skillGaps: cachedRow.skill_gaps ?? [],
    strengths: cachedRow.strengths,
    weaknesses: cachedRow.weaknesses,
    competitionIntelligence: competition,
    profileCompleteness: cachedRow.profile_completeness,
    aiGenerated: cachedRow.reason_generated === "ai",
    reasonGenerated: cachedRow.reason_generated,
  };
}

/**
 * Builds the full AI-powered recommendation list for the applicant portal
 * (engine v2 — configurable, explainable, analytics-backed).
 *
 * Strategy (performance-first):
 *  1. Load configurable weights from recommendation_settings (TTL-cached).
 *  2. Fetch the applicant feed (published, open internships) in ONE RPC call.
 *  3. Compute deterministic scores for every internship — skills, education,
 *     experience, projects, profile, competition, recency — normalized with
 *     the configured weights, then derive acceptance probability + overall
 *     ranking + skill gaps + strengths/weaknesses (all pure/deterministic).
 *  4. Load cached recommendations; reuse rows whose signal hash matches.
 *  5. Generate AI explanations for the top matches — batched into a single
 *     AI call, enriched with competition/acceptance context, and persisted —
 *     only when the cache is stale or missing.
 *  6. Persist analytics (weights snapshot, algorithm/cache version, reason,
 *     generated_at) and clean stale rows.
 *
 * The heavy work is cached, so opening the page repeatedly never re-runs AI.
 */
export async function getApplicantRecommendations(
  supabase: SupabaseClient,
  applicantId: string,
  applicantEmail: string
): Promise<{
  recommendations: RecommendationResult[];
  savedJobIds: string[];
  appliedJobIds: string[];
}> {
  // 1. Configurable weights + applicant data
  const [
    weights,
    profileRes,
    skillsRes,
    projectsRes,
    experienceRes,
    savedRes,
    appliedRes,
  ] = await Promise.all([
    getRecommendationWeights(supabase),
    supabase.from("applicant_profiles").select("*").eq("id", applicantId).maybeSingle(),
    supabase.from("applicant_skills").select("skill").eq("applicant_id", applicantId),
    supabase.from("applicant_projects").select("title, tech_stack").eq("applicant_id", applicantId),
    supabase.from("applicant_experience").select("role, company").eq("applicant_id", applicantId),
    supabase.from("saved_jobs").select("internship_id").eq("applicant_id", applicantId),
    supabase
      .from("applications")
      .select("internship_id")
      .eq("email", applicantEmail),
  ]);

  const profile = (profileRes.data ?? {}) as ApplicantProfileBundle;
  const projects = (projectsRes.data ?? []) as { title?: string; tech_stack?: string[] | null }[];
  const experience = (experienceRes.data ?? []) as { role?: string; company?: string }[];
  const applicantSkills = buildApplicantSkillList(
    (skillsRes.data ?? []) as { skill?: string }[],
    projects,
    experience
  );

  // 2. Feed — one RPC call
  const { data: feedRaw, error: feedError } = await supabase.rpc(
    "get_applicant_feed"
  );
  if (feedError) {
    console.error("[InternIQ AI] get_applicant_feed failed:", feedError.message);
  }
  const feed: ApplicantFeedItem[] = (feedRaw ?? []) as ApplicantFeedItem[];

  // 3. Load cache
  const cached = await getCachedRecommendations(supabase, applicantId);
  const cachedByInternship = new Map<string, ApplicantRecommendation>(
    cached.map((c) => [c.internship_id, c])
  );

  // 4. Compute rows (deterministic), reuse cache where the hash matches
  const rows: RecommendationRow[] = [];
  const freshHashes: { internship_id: string; signal_hash: string }[] = [];
  const needsAi: RecommendationRow[] = [];

  const recommendations: RecommendationResult[] = feed.map((item) => {
    const hash = signalHash(
      profile,
      applicantSkills,
      projects.map((p) => p.title || ""),
      experience.map((e) => `${e.role || ""} ${e.company || ""}`),
      item,
      weights
    );
    freshHashes.push({ internship_id: item.id, signal_hash: hash });

    const cachedRow = cachedByInternship.get(item.id);
    if (cachedRow && cachedRow.signal_hash === hash) {
      return fromCached(item, cachedRow);
    }

    const score = computeRecommendationScore({
      applicantSkills,
      requiredSkills: item.required_skills,
      preferredSkills: item.preferred_skills,
      profile: {
        degree: profile.degree,
        university: profile.university,
        bio: profile.bio,
        cgpa: profile.cgpa,
        fullName: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        hasCv: Boolean(profile.cv_path),
        hasGithub: Boolean(profile.github_url),
        hasLinkedin: Boolean(profile.linkedin_url),
        hasPortfolio: Boolean(profile.portfolio_url),
      },
      projects,
      experience,
      field: item.field,
      applicantCount: item.applicant_count,
      avgApplicantMatch: item.avg_applicant_match,
      createdAt: item.created_at,
      deadline: item.deadline,
      weights,
    });

    const row: RecommendationRow = { internshipId: item.id, score, hash };
    rows.push(row);
    if (score.matchedSkills.length > 0) needsAi.push(row);

    return toResult(
      item,
      score,
      score.reasoning,
      false,
      "computed"
    );
  });

  // 5. Batch AI explanations for top matches (deduped across concurrent loads)
  const aiExplanations = await withInflightDedup(applicantId, () =>
    enrichWithAiExplanations(
      profile,
      applicantSkills,
      projects,
      experience,
      feed,
      needsAi
    )
  );

  // 6. Persist rows so plain scores are cached too. IMPORTANT: keep any AI
  //    explanation already written for the top matches — never overwrite it
  //    with the deterministic fallback (that would clobber the cache).
  await upsertApplicantRecommendations(
    supabase,
    rows.map((row) => ({
      applicant_id: applicantId,
      internship_id: row.internshipId,
      match_score: row.score.matchScore,
      explanation: aiExplanations.get(row.internshipId) ?? row.score.reasoning,
      matched_skills: row.score.matchedSkills,
      missing_skills: row.score.missingSkills,
      signal_hash: row.hash,
      acceptance_probability: row.score.acceptanceProbability,
      overall_score: row.score.overallScore,
      skill_gaps: row.score.skillGaps,
      strengths: row.score.strengths,
      weaknesses: row.score.weaknesses,
      competition_level: row.score.competition.label,
      avg_applicant_match: row.score.competition.avgApplicantMatch,
      reason_generated: aiExplanations.has(row.internshipId) ? "ai" : "computed",
      algorithm_version: weights.algorithm_version,
      cache_version: weights.cache_version,
      weights_snapshot: weightsSnapshot(weights),
      profile_completeness: row.score.profileCompleteness,
    }))
  );

  // 7. Merge fresh AI explanations into the returned list
  for (const rec of recommendations) {
    if (rec.reasonGenerated === "cache") continue;
    const ai = aiExplanations.get(rec.id);
    if (ai) {
      rec.explanation = ai;
      rec.aiGenerated = true;
      rec.reasonGenerated = "ai";
    }
  }

  // 8. Clean stale cache
  await deleteStaleRecommendations(supabase, applicantId, freshHashes);

  // Sort: overall recommendation score first (Part 3 — smarter ordering).
  recommendations.sort((a, b) => b.overallScore - a.overallScore);

  return {
    recommendations,
    savedJobIds: (savedRes.data ?? []).map((s) => s.internship_id),
    appliedJobIds: (appliedRes.data ?? []).map((a) => a.internship_id),
  };
}

/**
 * Deduplicates concurrent AI generations for the same applicant so two
 * simultaneous page loads don't fire duplicate AI calls.
 */
async function withInflightDedup<T>(
  applicantId: string,
  fn: () => Promise<T>
): Promise<T> {
  const existing = inflight.get(applicantId);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflight.delete(applicantId);
  });
  inflight.set(applicantId, promise);
  return promise;
}
