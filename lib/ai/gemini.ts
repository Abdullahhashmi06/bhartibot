/**
 * @deprecated Import from `@/lib/ai/provider-manager` instead.
 *
 * All AI features now route through the Provider Manager which
 * supports Gemini, OpenRouter, Groq, and automatic fallback.
 *
 * This file remains as a re-export shim for backward compatibility.
 */

export {
  generateJson,
  generateText,
} from "@/lib/ai/provider-manager";

import type { AIProvider } from "@/lib/ai/providers/types";
import { geminiProvider } from "@/lib/ai/providers/gemini";

/** Returns the Gemini provider instance (used by provider-manager internally). 
 * @deprecated Use the provider-manager instead. */
export function getGeminiClient(): AIProvider {
  return geminiProvider;
}

export type GenerateTextOptions = {
  model?: string;
  systemInstruction?: string;
  json?: boolean;
};
