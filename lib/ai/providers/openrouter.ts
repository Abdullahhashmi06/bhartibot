import "server-only";

import { AiError, classifyAiError } from "@/lib/ai/errors";
import type { AIProvider, ProviderCallOptions, ProviderHealth } from "./types";

const DEFAULT_MODEL = "qwen/qwen3-30b-a3b:free";
const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const JSON_INSTRUCTION =
  "\n\nReturn ONLY valid JSON. Do not use markdown, code fences, or any commentary.";

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "MISSING_API_KEY",
      "Missing OPENROUTER_API_KEY in environment.",
    );
  }
  return apiKey;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChoice {
  message: OpenRouterMessage;
  finish_reason: string;
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  error?: { message?: string; code?: number };
}

async function callOpenRouter(
  prompt: string,
  json: boolean,
  options?: ProviderCallOptions,
): Promise<string> {
  const apiKey = getApiKey();
  const model = options?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const messages: OpenRouterMessage[] = [];

  let systemContent = options?.systemInstruction ?? "";
  if (json) {
    systemContent = (systemContent + JSON_INSTRUCTION).trim();
  }

  if (systemContent) {
    messages.push({ role: "system", content: systemContent });
  }

  messages.push({ role: "user", content: prompt });

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    let errorBody: string | undefined;
    try {
      const parsed = JSON.parse(bodyText) as OpenRouterResponse;
      errorBody = parsed.error?.message ?? bodyText;
    } catch {
      errorBody = bodyText;
    }

    const errorMessage = `OpenRouter API returned status ${response.status}: ${errorBody ?? "Unknown error"}`;

    if (response.status === 429) {
      throw new AiError("RATE_LIMIT", errorMessage);
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiError("INVALID_API_KEY", errorMessage);
    }
    if (response.status === 503 || response.status === 502) {
      throw new AiError("SERVICE_UNAVAILABLE", errorMessage);
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as OpenRouterResponse;

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiError(
      "MALFORMED_RESPONSE",
      "OpenRouter returned an empty response.",
    );
  }

  return text;
}

export const openrouterProvider: AIProvider = {
  name: "openrouter",

  async generateJson(
    prompt: string,
    options?: ProviderCallOptions,
  ): Promise<string> {
    try {
      return await callOpenRouter(prompt, true, options);
    } catch (error) {
      if (error instanceof AiError) throw error;
      console.error("[InternIQ AI] openrouter.generateJson raw error:", error);
      const classified = classifyAiError(error);
      console.error(
        "[InternIQ AI] openrouter.generateJson classified as:",
        classified.errorType,
        classified.logDetail,
      );
      throw classified;
    }
  },

  async generateText(
    prompt: string,
    options?: ProviderCallOptions,
  ): Promise<string> {
    try {
      return await callOpenRouter(prompt, false, options);
    } catch (error) {
      if (error instanceof AiError) throw error;
      console.error("[InternIQ AI] openrouter.generateText raw error:", error);
      const classified = classifyAiError(error);
      console.error(
        "[InternIQ AI] openrouter.generateText classified as:",
        classified.errorType,
        classified.logDetail,
      );
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
    return !!process.env.OPENROUTER_API_KEY;
  },
};
