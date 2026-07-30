import type { AiServiceResult } from "@/lib/ai/errors";

/** Unified options for every provider's generateJson / generateText call. */
export interface ProviderCallOptions {
  /** Optional system instruction / system prompt. */
  systemInstruction?: string;
  /** Model override (e.g. "gemini-3.5-flash-lite", "gpt-4o"). */
  model?: string;
}

/** Result of a provider health check. */
export type ProviderHealth = "healthy" | "degraded" | "offline";

/**
 * Every AI provider — Gemini, OpenRouter, Groq, and future ones — must
 * implement this interface so the Provider Manager can use them
 * interchangeably with retry, fallback, and health-checking.
 */
export interface AIProvider {
  /** Unique identifier, e.g. "gemini", "openrouter", "groq". */
  readonly name: string;

  /**
   * Generate a JSON response. The provider should set the appropriate
   * content-type / response-mime-type for JSON when available.
   * Returns the raw JSON text string.
   */
  generateJson(
    prompt: string,
    options?: ProviderCallOptions,
  ): Promise<string>;

  /**
   * Generate plain text (non-JSON) from the model.
   */
  generateText(
    prompt: string,
    options?: ProviderCallOptions,
  ): Promise<string>;

  /** Returns the current health status of this provider. */
  health(): ProviderHealth;

  /** True if the provider is configured and can be called. */
  isConfigured(): boolean;
}
