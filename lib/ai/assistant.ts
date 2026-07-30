import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import {
  buildDescriptionSuggestionPrompt,
  DESCRIPTION_SUGGEST_SYSTEM,
  buildRequirementReviewPrompt,
  REQUIREMENT_REVIEW_SYSTEM,
  buildScreeningQuestionSuggestionPrompt,
  SCREENING_QUESTION_ASSIST_SYSTEM,
  buildInternshipHealthPrompt,
  INTERNSHIP_HEALTH_SYSTEM,
  buildRecruiterTipsPrompt,
  RECRUITER_TIPS_SYSTEM,
  parseJsonFromModelText,
} from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DescriptionSuggestion {
  description: string;
  responsibilities: string[];
  learning_outcomes: string[];
  objectives: string[];
}

export interface RequirementReview {
  suggested_required: string[];
  suggested_preferred: string[];
  missing_requirements: string[];
  explanation: string;
}

export interface ScreeningQuestionSuggestion {
  technical: string[];
  behavioral: string[];
  problem_solving: string[];
  communication: string[];
  culture: string[];
}

export interface InternshipHealth {
  health_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface RecruiterTips {
  tips: string[];
}

/* ------------------------------------------------------------------ */
/*  Description Assistant                                              */
/* ------------------------------------------------------------------ */

export async function generateDescriptionSuggestion(opts: {
  title: string;
  field: string;
  location: string;
  workMode: string;
  duration: string;
  existingDescription: string;
}): Promise<DescriptionSuggestion> {
  const raw = await generateJson(buildDescriptionSuggestionPrompt(opts), {
    systemInstruction: DESCRIPTION_SUGGEST_SYSTEM,
  });

  try {
    return parseJsonFromModelText<DescriptionSuggestion>(raw);
  } catch {
    throw new AiError("JSON_PARSE", "Description suggestion could not be parsed.");
  }
}

/* ------------------------------------------------------------------ */
/*  Requirement Review + Missing Requirements                          */
/* ------------------------------------------------------------------ */

export async function reviewRequirements(opts: {
  title: string;
  field: string;
  description: string;
  currentRequired: string[];
  currentPreferred: string[];
}): Promise<RequirementReview> {
  const raw = await generateJson(buildRequirementReviewPrompt(opts), {
    systemInstruction: REQUIREMENT_REVIEW_SYSTEM,
  });

  try {
    return parseJsonFromModelText<RequirementReview>(raw);
  } catch {
    throw new AiError("JSON_PARSE", "Requirement review could not be parsed.");
  }
}

/* ------------------------------------------------------------------ */
/*  Screening Question Assistant                                       */
/* ------------------------------------------------------------------ */

export async function suggestScreeningQuestions(opts: {
  title: string;
  field: string;
  description: string;
  requirements: string[];
  currentQuestions: string[];
}): Promise<ScreeningQuestionSuggestion> {
  const raw = await generateJson(buildScreeningQuestionSuggestionPrompt(opts), {
    systemInstruction: SCREENING_QUESTION_ASSIST_SYSTEM,
  });

  try {
    return parseJsonFromModelText<ScreeningQuestionSuggestion>(raw);
  } catch {
    throw new AiError("JSON_PARSE", "Screening question suggestions could not be parsed.");
  }
}

/* ------------------------------------------------------------------ */
/*  Internship Health Analyzer                                        */
/* ------------------------------------------------------------------ */

export async function analyzeInternshipHealth(opts: {
  title: string;
  field: string;
  description: string;
  location: string;
  workMode: string;
  duration: string;
  requiredCount: number;
  preferredCount: number;
  questionCount: number;
}): Promise<InternshipHealth> {
  const raw = await generateJson(buildInternshipHealthPrompt(opts), {
    systemInstruction: INTERNSHIP_HEALTH_SYSTEM,
  });

  try {
    return parseJsonFromModelText<InternshipHealth>(raw);
  } catch {
    throw new AiError("JSON_PARSE", "Internship health analysis could not be parsed.");
  }
}

/* ------------------------------------------------------------------ */
/*  Recruiter Tips                                                     */
/* ------------------------------------------------------------------ */

export async function generateRecruiterTips(opts: {
  title: string;
  field: string;
  requiredCount: number;
  preferredCount: number;
  descriptionLength: number;
}): Promise<RecruiterTips> {
  const raw = await generateJson(buildRecruiterTipsPrompt(opts), {
    systemInstruction: RECRUITER_TIPS_SYSTEM,
  });

  try {
    return parseJsonFromModelText<RecruiterTips>(raw);
  } catch {
    throw new AiError("JSON_PARSE", "Recruiter tips could not be parsed.");
  }
}
