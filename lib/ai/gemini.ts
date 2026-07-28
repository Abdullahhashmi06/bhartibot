import "server-only";

import { GoogleGenAI } from "@google/genai";
import { AiError, classifyAiError } from "@/lib/ai/errors";

/**
 * Server-only Gemini client.
 * Reads GEMINI_API_KEY from the environment — never hardcode secrets.
 * Do not import this module from Client Components.
 */

const DEFAULT_MODEL = "gemini-3.6-flash";

let client: GoogleGenAI | null = null;

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "MISSING_API_KEY",
      "Missing GEMINI_API_KEY in environment."
    );
  }
  return apiKey;
}

/** Returns a singleton GoogleGenAI client configured with GEMINI_API_KEY. */
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return client;
}

export type GenerateTextOptions = {
  /** Gemini model id. Defaults to gemini-2.5-flash. */
  model?: string;
  /** Optional system instruction prepended via config. */
  systemInstruction?: string;
  /** When true, request application/json from Gemini (resume parse + scoring). */
  json?: boolean;
};

async function callGemini(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  const ai = getGeminiClient();
  // const model = options.model ?? DEFAULT_MODEL;

  const model = options.model ?? DEFAULT_MODEL;

  console.log("========== GEMINI ==========");6
  console.log("DEFAULT_MODEL:", DEFAULT_MODEL);
  console.log("options.model:", options.model);
  console.log("Using model:", model);
  console.log("============================");

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      ...(options.systemInstruction
        ? { systemInstruction: options.systemInstruction }
        : {}),
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new AiError("MALFORMED_RESPONSE", "Gemini returned an empty response.");
  }

  return text;
}

/**
 * Generate plain text from Gemini.
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  try {
    return await callGemini(prompt, options);
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw classifyAiError(error);
  }
}

/**
 * Generate a JSON string from Gemini with responseMimeType application/json.
 * Used by the resume parser and candidate scoring engine.
 */
export async function generateJson(
  prompt: string,
  options: Omit<GenerateTextOptions, "json"> = {}
): Promise<string> {
  try {
    return await callGemini(prompt, { ...options, json: true });
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw classifyAiError(error);
  }
}
