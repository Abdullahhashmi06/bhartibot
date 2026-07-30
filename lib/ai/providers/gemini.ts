import "server-only";

import { GoogleGenAI } from "@google/genai";
import { AiError, classifyAiError } from "@/lib/ai/errors";
import type { AIProvider, ProviderCallOptions, ProviderHealth } from "./types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

let client: GoogleGenAI | null = null;

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "MISSING_API_KEY",
      "Missing GEMINI_API_KEY in environment.",
    );
  }
  return apiKey;
}

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return client;
}

async function callGemini(
  prompt: string,
  json: boolean,
  options?: ProviderCallOptions,
): Promise<string> {
  const ai = getClient();
  const model = options?.model ?? DEFAULT_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      ...(options?.systemInstruction
        ? { systemInstruction: options.systemInstruction }
        : {}),
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new AiError(
      "MALFORMED_RESPONSE",
      "Gemini returned an empty response.",
    );
  }

  return text;
}

export const geminiProvider: AIProvider = {
  name: "gemini",

  async generateJson(
    prompt: string,
    options?: ProviderCallOptions,
  ): Promise<string> {
    try {
      return await callGemini(prompt, true, options);
    } catch (error) {
      if (error instanceof AiError) throw error;
      console.error("[InternIQ AI] gemini.generateJson raw error:", error);
      const classified = classifyAiError(error);
      console.error("[InternIQ AI] gemini.generateJson classified as:", classified.errorType, classified.logDetail);
      throw classified;
    }
  },

  async generateText(
    prompt: string,
    options?: ProviderCallOptions,
  ): Promise<string> {
    try {
      return await callGemini(prompt, false, options);
    } catch (error) {
      if (error instanceof AiError) throw error;
      console.error("[InternIQ AI] gemini.generateText raw error:", error);
      const classified = classifyAiError(error);
      console.error("[InternIQ AI] gemini.generateText classified as:", classified.errorType, classified.logDetail);
      throw classified;
    }
  },

  health(): ProviderHealth {
    try {
      getApiKey();
      return "healthy";
    } catch {
      return "offline";
    }
  },

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  },
};
