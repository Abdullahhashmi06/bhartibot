import "server-only";

import { generateJson } from "@/lib/ai/gemini";
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
