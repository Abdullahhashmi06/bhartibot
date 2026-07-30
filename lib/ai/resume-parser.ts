import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildResumeParsePrompt,
  normalizeParsedResume,
  parseJsonFromModelText,
  RESUME_PARSE_SYSTEM,
} from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type { ParsedResume } from "@/lib/types";

/**
 * Step 2 — Resume parser.
 *
 * Input: plain resume text (from PDF extraction).
 * Output: structured ParsedResume JSON with fixed keys.
 */
export async function parseResumeText(resumeText: string): Promise<ParsedResume> {
  const trimmed = resumeText.trim();
  if (!trimmed) {
    throw new AiError(
      "PDF_EXTRACTION",
      "Resume text is empty after PDF extraction."
    );
  }

  const rawText = await generateJson(buildResumeParsePrompt(trimmed), {
    systemInstruction: RESUME_PARSE_SYSTEM,
  });

  try {
    const parsed = parseJsonFromModelText<Partial<ParsedResume>>(rawText);
    return normalizeParsedResume(parsed);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `parseResumeText JSON parse failed: ${rawText.slice(0, 200)}`
    );
  }
}
