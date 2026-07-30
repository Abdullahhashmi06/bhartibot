import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildRecruiterNotesPrompt,
  RECRUITER_NOTES_SYSTEM,
  parseJsonFromModelText,
} from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type { CandidateScoreInput } from "@/lib/types";

export interface RecruiterNotesResult {
  recruiter_notes: string;
}

/**
 * Generates concise, professional internal recruiter notes for a candidate.
 *
 * Uses Gemini to analyze the candidate's resume, internship requirements,
 * and screening answers — returns a short paragraph (max 100 words)
 * with hiring recommendation, strongest qualifications, and largest gaps.
 */
export async function generateRecruiterNotes(
  input: CandidateScoreInput
): Promise<string> {
  const rawText = await generateJson(buildRecruiterNotesPrompt(input), {
    systemInstruction: RECRUITER_NOTES_SYSTEM,
  });

  let parsed: RecruiterNotesResult;
  try {
    parsed = parseJsonFromModelText<RecruiterNotesResult>(rawText);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `Recruiter notes JSON could not be parsed: ${rawText.slice(0, 200)}`
    );
  }

  return parsed.recruiter_notes;
}
