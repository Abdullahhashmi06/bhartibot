/**
 * Pure, deterministic matching + scoring logic for the applicant portal.
 *
 * This module contains NO server-only imports so it can be shared safely
 * between the server-side recommendation engine (lib/ai/recommendations.ts)
 * and client-side widgets. All heavy inputs (weights, profile, feed rows) are
 * passed in as plain data.
 *
 * Two entry points:
 *   • computeSkillMatch()          — legacy skill-only scoring (60/25/10/5),
 *                                    kept for backward compatibility.
 *   • computeRecommendationScore() — v2 engine: configurable weights from the
 *                                    recommendation_settings table, acceptance
 *                                    probability, overall score, skill gaps,
 *                                    strengths/weaknesses and competition
 *                                    intelligence. Fully deterministic.
 */

import type {
  CompetitionIntelligence,
  RecommendationWeights,
  SkillGap,
} from "@/lib/types";

export interface SkillMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  /** Deterministic reasoning used as a fallback when no AI explanation exists. */
  reasoning: string;
}

export interface RecommendationScoreInput {
  applicantSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  profile: {
    degree?: string | null;
    university?: string | null;
    bio?: string | null;
    cgpa?: string | null;
    fullName?: string | null;
    phone?: string | null;
    location?: string | null;
    hasCv?: boolean;
    hasGithub?: boolean;
    hasLinkedin?: boolean;
    hasPortfolio?: boolean;
  };
  projects?: { title?: string; tech_stack?: string[] | null }[];
  experience?: { role?: string; company?: string }[];
  field?: string | null;
  applicantCount: number;
  avgApplicantMatch?: number | null;
  createdAt: string;
  deadline: string | null;
  weights: RecommendationWeights;
}

export interface RecommendationScoreOutput {
  /** Weighted overall AI Match score (0–100). */
  matchScore: number;
  /** Per-dimension component scores (0–100 each), for debugging/analytics. */
  componentScores: {
    skills: number;
    education: number;
    experience: number;
    projects: number;
    profile: number;
    competition: number;
    recency: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  missingRequired: string[];
  missingPreferred: string[];
  /** Skill-gap analysis with priority order and estimated gains. */
  skillGaps: SkillGap[];
  /** Estimated probability of progressing to shortlist/interview (0–100). */
  acceptanceProbability: number;
  /** Composite ordering score used for the recommendation ranking. */
  overallScore: number;
  competition: CompetitionIntelligence;
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  profileCompleteness: number;
}

/** Normalize a skill for fuzzy comparison. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Loose match — substring containment in either direction (e.g. "React" ≈ "React Native"). */
function skillsMatch(applicantSkill: string, requirement: string): boolean {
  const a = normalize(applicantSkill);
  const b = normalize(requirement);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Computes a compatibility score (0–100) for an applicant against an
 * internship's required + preferred skills. Legacy signature kept for
 * backward compatibility (used by older client widgets as a fallback).
 */
export function computeSkillMatch(
  applicantSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[],
  options?: {
    field?: string | null;
    degree?: string | null;
    university?: string | null;
    bio?: string | null;
  }
): SkillMatchResult {
  const skills = (applicantSkills || []).map(normalize).filter(Boolean);

  const matchedRequired = (requiredSkills || []).filter((req) =>
    skills.some((s) => skillsMatch(s, req))
  );
  const missingRequired = (requiredSkills || []).filter(
    (req) => !matchedRequired.includes(req)
  );
  const matchedPreferred = (preferredSkills || []).filter((req) =>
    skills.some((s) => skillsMatch(s, req))
  );
  const missingPreferred = (preferredSkills || []).filter(
    (req) => !matchedPreferred.includes(req)
  );

  const requiredCount = requiredSkills?.length || 0;
  const preferredCount = preferredSkills?.length || 0;

  const requiredRatio = requiredCount > 0 ? matchedRequired.length / requiredCount : 0;
  const preferredRatio = preferredCount > 0 ? matchedPreferred.length / preferredCount : 0;

  let score = requiredRatio * 60 + preferredRatio * 25;

  // Field relevance (10%)
  const fieldText = normalize(options?.field || "");
  const profileText = normalize(
    [options?.degree, options?.university, options?.bio, ...skills].join(" ")
  );
  if (fieldText && profileText) {
    const fieldTokens = fieldText.split(" ").filter((t) => t.length > 2);
    const hits = fieldTokens.filter((token) => profileText.includes(token));
    if (fieldTokens.length > 0) {
      score += (hits.length / fieldTokens.length) * 10;
    }
  }

  // Profile completeness confidence (5%)
  if (options?.degree && options?.university) score += 5;
  else if (options?.degree || options?.university) score += 2.5;

  const matchScore = Math.min(100, Math.max(0, Math.round(score)));

  // Deterministic reasoning (fallback for when AI explanations are unavailable)
  let reasoning: string;
  if (matchedRequired.length > 0) {
    const top = matchedRequired.slice(0, 3).join(", ");
    reasoning = `Recommended because your ${top} skills strongly match this role.`;
  } else if (matchedPreferred.length > 0) {
    const top = matchedPreferred.slice(0, 3).join(", ");
    reasoning = `Strong match based on your ${top} experience.`;
  } else if (skills.length === 0) {
    reasoning =
      "Complete your profile with skills to unlock personalized AI recommendations.";
  } else {
    reasoning =
      "This opportunity may still be a good fit — consider building the missing skills listed below.";
  }

  return {
    matchScore,
    matchedSkills: [...matchedRequired, ...matchedPreferred],
    missingSkills: [...missingRequired, ...missingPreferred],
    reasoning,
  };
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  V2 ENGINE — configurable weighted scoring                              */
/* ──────────────────────────────────────────────────────────────────────── */

/** Scores the applicant profile completeness (0–100) from real profile fields. */
export function computeProfileCompleteness(
  profile: RecommendationScoreInput["profile"],
  skillsCount: number
): number {
  let score = 0;
  if (profile?.fullName) score += 15;
  if (profile?.phone) score += 5;
  if (profile?.location) score += 5;
  if (profile?.university) score += 10;
  if (profile?.degree) score += 10;
  if (profile?.bio) score += 10;
  if (profile?.cgpa) score += 5;
  if (profile?.hasCv) score += 20;
  if (profile?.hasGithub) score += 5;
  if (profile?.hasLinkedin) score += 5;
  if (profile?.hasPortfolio) score += 5;
  if (skillsCount > 0) score += 5;
  return clamp(score, 0, 100);
}

/** Field overlap — fraction of internship-field tokens found in the text. */
function fieldOverlap(field: string | null | undefined, text: string): number {
  const fieldTokens = normalize(field || "")
    .split(" ")
    .filter((t) => t.length > 2);
  if (fieldTokens.length === 0 || !text) return 0;
  const normalized = normalize(text);
  const hits = fieldTokens.filter((token) => normalized.includes(token));
  return hits.length / fieldTokens.length;
}

/** Competition score — fewer applicants = higher score (0–100). */
export function computeCompetitionScore(count: number): number {
  return clamp(100 - count * 2.2, 10, 100);
}

/** Recency score — newer postings score higher (0–100, 30-day window). */
export function computeRecencyScore(createdAt: string): number {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return clamp(100 - days * 3, 20, 100);
}

/** Competition intelligence block shown on every card. */
export function getCompetitionIntelligence(
  count: number,
  avgApplicantMatch: number | null
): CompetitionIntelligence {
  const band = getCompetitionBand(count);
  const estimatedDifficulty: CompetitionIntelligence["estimatedDifficulty"] =
    count <= 10 ? "Low" : count <= 30 ? "Moderate" : "High";
  return {
    count,
    label: band.label,
    tone: band.tone,
    dot: band.dot,
    estimatedDifficulty,
    avgApplicantMatch,
  };
}

/**
 * Computes the full v2 recommendation score for one internship.
 *
 * Weighted model (weights from recommendation_settings, sum normalized to 100):
 *   skills, education, experience, projects, profile, competition, recency.
 *
 * Then derives:
 *   • acceptanceProbability — blend of match, competition, profile completeness,
 *     plus penalties for a strong existing applicant pool / imminent deadline.
 *   • overallScore — composite used for ranking (match + acceptance dominate).
 *   • skillGaps — each missing skill with priority + estimated gains.
 *   • strengths/weaknesses — deterministic, generated from real profile data.
 */
export function computeRecommendationScore(
  input: RecommendationScoreInput
): RecommendationScoreOutput {
  const w = input.weights;
  const totalW =
    w.required_skills_weight +
    w.preferred_skills_weight +
    w.education_weight +
    w.experience_weight +
    w.project_weight +
    w.profile_weight +
    w.competition_weight +
    w.recency_weight;

  const skills = (input.applicantSkills || []).map(normalize).filter(Boolean);
  const required = input.requiredSkills || [];
  const preferred = input.preferredSkills || [];
  const projects = input.projects || [];
  const experience = input.experience || [];
  const profile = input.profile || {};

  // ── Skills ─────────────────────────────────────────────────────────────
  const matchedRequired = required.filter((req) =>
    skills.some((s) => skillsMatch(s, req))
  );
  const missingRequired = required.filter((req) => !matchedRequired.includes(req));
  const matchedPreferred = preferred.filter((req) =>
    skills.some((s) => skillsMatch(s, req))
  );
  const missingPreferred = preferred.filter(
    (req) => !matchedPreferred.includes(req)
  );

  const reqCount = required.length || 0;
  const prefCount = preferred.length || 0;
  const reqRatio = reqCount > 0 ? matchedRequired.length / reqCount : 0;
  const prefRatio = prefCount > 0 ? matchedPreferred.length / prefCount : 0;
  const reqPrefW = w.required_skills_weight + w.preferred_skills_weight;
  const skillsScore =
    reqPrefW > 0
      ? ((reqRatio * w.required_skills_weight +
          prefRatio * w.preferred_skills_weight) /
          reqPrefW) *
        100
      : 30; // no requirements listed — neutral

  // ── Education ──────────────────────────────────────────────────────────
  let educationScore = 30;
  if (profile.degree && profile.university) educationScore = 80;
  else if (profile.degree || profile.university) educationScore = 55;
  educationScore +=
    fieldOverlap(input.field, `${profile.degree || ""} ${profile.university || ""}`) *
    20;
  educationScore = clamp(educationScore, 0, 100);

  // ── Experience ─────────────────────────────────────────────────────────
  const expCount = Math.min(experience.length, 4);
  let experienceScore = (expCount / 4) * 60;
  const expText = experience
    .map((e) => `${e.role || ""} ${e.company || ""}`)
    .join(" ");
  experienceScore += fieldOverlap(input.field, expText) * 40;
  experienceScore = clamp(experienceScore, 0, 100);

  // ── Projects ───────────────────────────────────────────────────────────
  const projCount = Math.min(projects.length, 3);
  let projectScore = (projCount / 3) * 50;
  const projectTechs = projects.flatMap((p) => p.tech_stack || []);
  if (required.length > 0) {
    const covered = required.filter((req) =>
      projectTechs.some((t) => skillsMatch(t, req))
    ).length;
    projectScore += (covered / required.length) * 50;
  }
  projectScore = clamp(projectScore, 0, 100);

  // ── Profile ────────────────────────────────────────────────────────────
  const profileCompleteness = computeProfileCompleteness(profile, skills.length);

  // ── Competition ────────────────────────────────────────────────────────
  const competitionScore = computeCompetitionScore(input.applicantCount);

  // ── Recency ────────────────────────────────────────────────────────────
  const recencyScore = computeRecencyScore(input.createdAt);

  // ── Weighted overall match ─────────────────────────────────────────────
  // skillsScore already blends required + preferred internally, so the skills
  // dimension is weighted by their COMBINED weight share over the full total.
  const denom = totalW > 0 ? totalW : 1;
  const matchScore = clamp(
    Math.round(
      (skillsScore * (w.required_skills_weight + w.preferred_skills_weight) +
        educationScore * w.education_weight +
        experienceScore * w.experience_weight +
        projectScore * w.project_weight +
        profileCompleteness * w.profile_weight +
        competitionScore * w.competition_weight +
        recencyScore * w.recency_weight) /
        denom
    ),
    0,
    100
  );

  // ── Acceptance probability (deterministic) ─────────────────────────────
  let acceptance =
    matchScore * 0.55 + competitionScore * 0.35 + profileCompleteness * 0.1;
  if (input.avgApplicantMatch != null) {
    // A stronger existing applicant pool slightly lowers this applicant's odds.
    acceptance -= clamp(input.avgApplicantMatch - matchScore, 0, 40) * 0.2;
  }
  if (input.deadline) {
    const daysLeft = (new Date(input.deadline).getTime() - Date.now()) / 86_400_000;
    if (daysLeft <= 3) acceptance -= 4;
    else if (daysLeft <= 7) acceptance -= 2;
  }
  const acceptanceProbability = clamp(Math.round(acceptance), 2, 97);

  // ── Overall score (ranking) ────────────────────────────────────────────
  const overallScore = clamp(
    Math.round(
      matchScore * 0.4 +
        acceptanceProbability * 0.4 +
        competitionScore * 0.12 +
        recencyScore * 0.08
    ),
    0,
    100
  );

  // ── Skill gaps (priority learning order) ───────────────────────────────
  const skillGaps: SkillGap[] = [];
  const requiredGain =
    reqCount > 0 ? (w.required_skills_weight * 100) / reqCount / totalW : 0;
  const preferredGain =
    prefCount > 0 ? (w.preferred_skills_weight * 100) / prefCount / totalW : 0;

  missingRequired.forEach((skill) => {
    const matchGain = Math.min(20, Math.round(requiredGain || 0));
    skillGaps.push({
      skill,
      priority: "High",
      matchGain,
      acceptanceGain: Math.max(1, Math.round(matchGain * 0.55)),
    });
  });
  missingPreferred.forEach((skill) => {
    const matchGain = Math.min(20, Math.round(preferredGain || 0));
    skillGaps.push({
      skill,
      priority: "Medium",
      matchGain,
      acceptanceGain: Math.max(1, Math.round(matchGain * 0.55)),
    });
  });
  skillGaps.sort(
    (a, b) =>
      (a.priority === "High" ? 0 : 1) - (b.priority === "High" ? 0 : 1) ||
      b.matchGain - a.matchGain
  );
  const topGaps = skillGaps.slice(0, 6);

  // ── Strengths / weaknesses (deterministic) ─────────────────────────────
  const strengths: string[] = [];
  if (matchedRequired.length > 0) {
    strengths.push(
      `Proficient in ${matchedRequired.slice(0, 3).join(", ")} — directly matches the required skills.`
    );
  }
  if (matchedPreferred.length > 0) {
    strengths.push(
      `Also brings ${matchedPreferred.slice(0, 2).join(", ")}, a preferred skill for this role.`
    );
  }
  if (profile.degree && profile.university) {
    strengths.push(`Pursuing ${profile.degree} at ${profile.university}.`);
  } else if (profile.degree) {
    strengths.push(`Studying ${profile.degree}.`);
  }
  if (projects.length > 0) {
    const titles = projects
      .slice(0, 2)
      .map((p) => p.title || "Untitled")
      .join(", ");
    strengths.push(
      `Built ${projects.length} project${projects.length > 1 ? "s" : ""}${titles ? ` including ${titles}` : ""}.`
    );
  }
  if (experience.length > 0) {
    strengths.push(`Has ${experience.length} experience entr${experience.length > 1 ? "ies" : "y"}.`);
  }
  if (profile.cgpa) {
    strengths.push(`Strong academic record (CGPA ${profile.cgpa}).`);
  }
  if (profile.hasCv) {
    strengths.push("Resume uploaded — recruiters can review your CV.");
  }
  if (profile.hasGithub || profile.hasLinkedin || profile.hasPortfolio) {
    strengths.push("Portfolio links provided for extra credibility.");
  }

  const weaknesses: string[] = [];
  if (missingRequired.length > 0) {
    weaknesses.push(
      `Missing required skills: ${missingRequired.slice(0, 3).join(", ")}.`
    );
  }
  if (missingPreferred.length > 0) {
    weaknesses.push(
      `Lacks preferred skills: ${missingPreferred.slice(0, 2).join(", ")}.`
    );
  }
  if (!profile.hasCv) {
    weaknesses.push("No resume uploaded yet — this limits recruiter assessment.");
  }
  if (profileCompleteness < 40) {
    weaknesses.push(`Profile is only ${profileCompleteness}% complete.`);
  }
  if (experience.length === 0) {
    weaknesses.push("No prior internship or work experience listed.");
  }
  if (projects.length === 0) {
    weaknesses.push("No projects listed yet.");
  }

  // ── Deterministic reasoning (fallback when no AI explanation exists) ───
  let reasoning: string;
  if (matchedRequired.length > 0) {
    const top = matchedRequired.slice(0, 3).join(", ");
    const comp = getCompetitionIntelligence(
      input.applicantCount,
      input.avgApplicantMatch ?? null
    );
    reasoning = `Recommended because your ${top} skills strongly match this role. Competition is ${comp.label.toLowerCase()}, giving you a ${acceptanceProbability}% estimated chance of progressing.`;
  } else if (matchedPreferred.length > 0) {
    const top = matchedPreferred.slice(0, 3).join(", ");
    reasoning = `Strong match based on your ${top} experience.`;
  } else if (skills.length === 0) {
    reasoning =
      "Complete your profile with skills to unlock personalized AI recommendations.";
  } else {
    reasoning =
      "This opportunity may still be a good fit — consider building the missing skills listed below.";
  }

  return {
    matchScore,
    componentScores: {
      skills: Math.round(skillsScore),
      education: Math.round(educationScore),
      experience: Math.round(experienceScore),
      projects: Math.round(projectScore),
      profile: profileCompleteness,
      competition: Math.round(competitionScore),
      recency: Math.round(recencyScore),
    },
    matchedSkills: [...matchedRequired, ...matchedPreferred],
    missingSkills: [...missingRequired, ...missingPreferred],
    missingRequired,
    missingPreferred,
    skillGaps: topGaps,
    acceptanceProbability,
    overallScore,
    competition: getCompetitionIntelligence(
      input.applicantCount,
      input.avgApplicantMatch ?? null
    ),
    strengths,
    weaknesses,
    reasoning,
    profileCompleteness,
  };
}

/**
 * Builds the applicant's full skill vocabulary from every source:
 * manually entered skills, project tech stacks, and work experience roles.
 * Deduplicated, lowercased, trimmed.
 */
export function buildApplicantSkillList(
  skills: { skill?: string }[],
  projects?: { tech_stack?: string[] | null }[],
  experience?: { role?: string; company?: string }[]
): string[] {
  const set = new Set<string>();

  (skills || []).forEach((s) => {
    if (s?.skill) set.add(s.skill.toLowerCase().trim());
  });
  (projects || []).forEach((p) => {
    (p?.tech_stack || []).forEach((t) => {
      if (t) set.add(t.toLowerCase().trim());
    });
  });
  (experience || []).forEach((e) => {
    if (e?.role) set.add(e.role.toLowerCase().trim());
    if (e?.company) set.add(e.company.toLowerCase().trim());
  });

  return Array.from(set).filter(Boolean);
}

/** Competition band based on live applicant count. */
export function getCompetitionBand(count: number): {
  label: string;
  tone: "emerald" | "amber" | "rose";
  dot: string;
  hint: string;
} {
  if (count <= 10) {
    return { label: "Low Competition", tone: "emerald", dot: "🟢", hint: "Great time to apply — few applicants so far." };
  }
  if (count <= 30) {
    return { label: "Moderate Competition", tone: "amber", dot: "🟡", hint: "Decent number of applicants — stand out with a strong profile." };
  }
  return { label: "Highly Competitive", tone: "rose", dot: "🔴", hint: "Many applicants — make your CV and answers count." };
}
