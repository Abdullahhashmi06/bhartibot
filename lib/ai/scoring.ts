import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildScorePrompt,
  parseJsonFromModelText,
  SCORE_SYSTEM,
} from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type { CandidateScore, CandidateScoreInput } from "@/lib/types";

const VALID_RECOMMENDATIONS = new Set([
  "Hire",
  "Interview",
  "Maybe",
  "Reject",
]);

/**
 * Step 3 — Candidate scoring engine.
 *
 * Inputs: parsed resume JSON, internship, requirements, screening answers.
 * Output: match score, strengths/weaknesses, missing skills, recommendation, reasoning.
 */
export async function scoreCandidate(
  input: CandidateScoreInput
): Promise<CandidateScore> {
  const rawText = await generateJson(buildScorePrompt(input), {
    systemInstruction: SCORE_SYSTEM,
  });

  let parsed: Partial<CandidateScore>;
  try {
    parsed = parseJsonFromModelText<Partial<CandidateScore>>(rawText);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `scoreCandidate JSON parse failed: ${rawText.slice(0, 200)}`
    );
  }

  const matchScore = Math.min(
    100,
    Math.max(0, Math.round(Number(parsed.match_score) || 0))
  );
  const recommendation = VALID_RECOMMENDATIONS.has(String(parsed.recommendation))
    ? (parsed.recommendation as CandidateScore["recommendation"])
    : "Maybe";

  return {
    match_score: matchScore,

    confidence_score:
      Math.min(100, Math.max(0, Number(parsed.confidence_score) || 0)),

    resume_quality_score:
      Math.min(100, Math.max(0, Number(parsed.resume_quality_score) || 0)),

    technical_score:
      Math.min(100, Math.max(0, Number(parsed.technical_score) || 0)),

    education_score:
      Math.min(100, Math.max(0, Number(parsed.education_score) || 0)),

    experience_score:
      Math.min(100, Math.max(0, Number(parsed.experience_score) || 0)),

    communication_score:
      Math.min(100, Math.max(0, Number(parsed.communication_score) || 0)),

    culture_fit_score:
      Math.min(100, Math.max(0, Number(parsed.culture_fit_score) || 0)),

    candidate_summary:
      String(parsed.candidate_summary ?? ""),

    strengths_summary:
      String(parsed.strengths_summary ?? ""),

    risks_summary:
      String(parsed.risks_summary ?? ""),

    strength_summary:
      String(parsed.strength_summary ?? ""),

    risk_summary:
      String(parsed.risk_summary ?? ""),

    overall_explanation:
      String(parsed.overall_explanation ?? ""),

    technical_reason:
      String(parsed.technical_reason ?? ""),

    education_reason:
      String(parsed.education_reason ?? ""),

    experience_reason:
      String(parsed.experience_reason ?? ""),

    communication_reason:
      String(parsed.communication_reason ?? ""),

    culture_reason:
      String(parsed.culture_reason ?? ""),

    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map(String)
      : [],

    weaknesses: Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.map(String)
      : [],

    missing_skills: Array.isArray(parsed.missing_skills)
      ? parsed.missing_skills.map(String)
      : [],

    recommendation,

    reasoning: String(parsed.reasoning ?? ""),
  };
}
