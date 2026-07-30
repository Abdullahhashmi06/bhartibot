import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildCandidateSummaryPrompt,
  CANDIDATE_SUMMARY_SYSTEM,
  parseJsonFromModelText,
} from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type { CandidateScoreInput } from "@/lib/types";

export interface CandidateSummaryResult {
  candidate_summary: string;
}

/**
 * Generates a concise, recruiter-friendly candidate summary.
 *
 * Uses Gemini to analyze the candidate's resume, internship requirements,
 * and screening answers — returns an 80–150 word summary with
 * strongest qualifications, largest gaps, and hiring recommendation.
 */
export async function generateCandidateSummary(
  input: CandidateScoreInput
): Promise<string> {
  const rawText = await generateJson(buildCandidateSummaryPrompt(input), {
    systemInstruction: CANDIDATE_SUMMARY_SYSTEM,
  });

  let parsed: CandidateSummaryResult;
  try {
    parsed = parseJsonFromModelText<CandidateSummaryResult>(rawText);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `Candidate summary JSON could not be parsed: ${rawText.slice(0, 200)}`
    );
  }

  return parsed.candidate_summary;
}
