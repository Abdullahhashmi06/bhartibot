/**
 * AI Provider Configuration
 *
 * Central configuration for the provider-agnostic AI layer.
 * All values can be overridden via environment variables.
 *
 * Environment variables:
 *   AI_PROVIDER          — preferred provider (default: "gemini")
 *   AI_FALLBACK_ORDER    — comma-separated fallback chain  (default: "openrouter,groq")
 *   AI_TIMEOUT_MS        — per-request timeout in ms        (default: 90000)
 *   AI_RETRY_COUNT       — retries before switching         (default: 1)
 */

export interface AiConfig {
  /** Name of the preferred provider, e.g. "gemini", "openrouter", "groq". */
  preferredProvider: string;

  /** Fallback order — provider names in priority sequence. */
  fallbackOrder: string[];

  /** Per-request timeout in milliseconds. */
  timeoutMs: number;

  /** Number of retries per provider before switching to the fallback. */
  retryCount: number;
}

let cachedConfig: AiConfig | null = null;

/** Load configuration from environment variables (cached after first read). */
export function getAiConfig(): AiConfig {
  if (cachedConfig) return cachedConfig;

  const preferredProvider = process.env.AI_PROVIDER ?? "gemini";

  const rawFallback = process.env.AI_FALLBACK_ORDER;
  const fallbackOrder = rawFallback
    ? rawFallback.split(",").map((s) => s.trim()).filter(Boolean)
    : ["openrouter", "groq"];

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 90_000;
  const retryCount = Number(process.env.AI_RETRY_COUNT) || 1;

  cachedConfig = { preferredProvider, fallbackOrder, timeoutMs, retryCount };
  return cachedConfig;
}

/** Reset the cached config (useful for testing with different env values). */
export function resetAiConfig(): void {
  cachedConfig = null;
}
