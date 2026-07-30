import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildInterviewPrompt,
  INTERVIEW_SYSTEM,
  parseJsonFromModelText,
} from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type { CandidateScoreInput } from "@/lib/types";

export interface InterviewQuestion {
  question: string;
  purpose: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category:
    | "Technical"
    | "Projects"
    | "Behavioral"
    | "Problem Solving"
    | "Communication";
}

/**
 * Generates personalized interview questions for a candidate.
 *
 * Uses Gemini to analyze the candidate's resume, the internship requirements,
 * screening answers, and skill gaps — then returns 10 tailored questions
 * spanning technical, behavioral, project, communication, and problem-solving categories. */
export async function generateInterviewQuestions(
  input: CandidateScoreInput
): Promise<InterviewQuestion[]> {
  const rawText = await generateJson(buildInterviewPrompt(input), {
    systemInstruction: INTERVIEW_SYSTEM,
  });

  let parsed: InterviewQuestion[];
  try {
    parsed = parseJsonFromModelText<InterviewQuestion[]>(rawText);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `Interview question JSON could not be parsed: ${rawText.slice(0, 200)}`
    );
  }

  return parsed;
}