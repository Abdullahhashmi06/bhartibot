import "server-only";

import type {
  AIProvider,
  ProviderCallOptions,
  ProviderHealth,
} from "@/lib/ai/providers/types";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { openrouterProvider } from "@/lib/ai/providers/openrouter";
import { groqProvider } from "@/lib/ai/providers/groq";
import { getAiConfig } from "@/lib/ai/config";
import { recordMetric } from "@/lib/ai/metrics";
import { AiError, classifyAiError } from "@/lib/ai/errors";

/* ------------------------------------------------------------------ */
/*  Provider Registry                                                  */
/* ------------------------------------------------------------------ */

const PROVIDERS: Record<string, AIProvider> = {
  gemini: geminiProvider,
  openrouter: openrouterProvider,
  groq: groqProvider,
};

/** Last-known health state per provider, to avoid hammering offline services. */
const healthCache = new Map<string, { health: ProviderHealth; checkedAt: number }>();
const HEALTH_TTL_MS = 30_000; // re-check every 30 seconds

function getCachedHealth(name: string): ProviderHealth | null {
  const cached = healthCache.get(name);
  if (cached && Date.now() - cached.checkedAt < HEALTH_TTL_MS) {
    return cached.health;
  }
  return null;
}

function setCachedHealth(name: string, health: ProviderHealth): void {
  healthCache.set(name, { health, checkedAt: Date.now() });
}

/** Return the provider instance by name, or undefined if unknown. */
function getProvider(name: string): AIProvider | undefined {
  return PROVIDERS[name];
}

/** Build the ordered list of providers to try (preferred first, then fallbacks). */
function buildProviderChain(): AIProvider[] {
  const config = getAiConfig();
  const chain: AIProvider[] = [];

  // Start with the preferred provider
  const preferred = getProvider(config.preferredProvider);
  if (preferred) {
    const health = getCachedHealth(preferred.name) ?? preferred.health();
    if (health !== "offline") {
      chain.push(preferred);
    }
  }

  // Append fallback providers that are not already in the chain
  for (const name of config.fallbackOrder) {
    if (name === config.preferredProvider) continue; // already added
    const provider = getProvider(name);
    if (provider) {
      const health = getCachedHealth(provider.name) ?? provider.health();
      if (health !== "offline") {
        chain.push(provider);
      }
    }
  }

  // If the preferred provider was filtered out (offline), add it back as last resort
  if (preferred && !chain.includes(preferred)) {
    chain.push(preferred);
  }

  return chain;
}

/* ------------------------------------------------------------------ */
/*  Retry + Fallback Logic                                             */
/* ------------------------------------------------------------------ */

function isRetryableError(error: unknown): boolean {
  if (error instanceof AiError) return error.retryable;

  const text = String(error).toLowerCase();
  return (
    text.includes("rate limit") ||
    text.includes("429") ||
    text.includes("503") ||
    text.includes("timeout") ||
    text.includes("unavailable") ||
    text.includes("network") ||
    text.includes("econnreset") ||
    text.includes("etimedout") ||
    text.includes("fetch failed")
  );
}

type GenerateFn = (
  provider: AIProvider,
  prompt: string,
  options?: ProviderCallOptions,
) => Promise<string>;

async function executeWithRetryAndFallback(
  generateFn: GenerateFn,
  prompt: string,
  options?: ProviderCallOptions,
  jsonMode: boolean = false,
): Promise<string> {
  const config = getAiConfig();
  const chain = buildProviderChain();

  if (chain.length === 0) {
    throw new AiError(
      "SERVICE_UNAVAILABLE",
      "No AI providers are available. Check your API key configuration.",
    );
  }

  let lastError: unknown;
  let usedFallback = false;

  for (let providerIndex = 0; providerIndex < chain.length; providerIndex++) {
    const provider = chain[providerIndex];
    if (providerIndex > 0) usedFallback = true;

    // Retry loop for the current provider
    for (let retry = 0; retry <= config.retryCount; retry++) {
      const startTime = Date.now();
      try {
        const result = await generateFn(provider, prompt, options);

        // Mark healthy on success
        setCachedHealth(provider.name, "healthy");

        recordMetric({
          provider: provider.name,
          durationMs: Date.now() - startTime,
          success: true,
          retryCount: retry,
          usedFallback,
          status: usedFallback ? "Fallback" : "Success",
        });

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const classified = classifyAiError(error);
        lastError = error;

        // Record the failure
        recordMetric({
          provider: provider.name,
          durationMs,
          success: false,
          errorType: classified.errorType,
          retryCount: retry,
          usedFallback,
          status: "Failure",
        });

        // Mark as degraded / offline based on error type
        if (
          classified.errorType === "SERVICE_UNAVAILABLE" ||
          classified.errorType === "NETWORK_TIMEOUT"
        ) {
          setCachedHealth(provider.name, "degraded");
        }
        if (
          classified.errorType === "MISSING_API_KEY" ||
          classified.errorType === "INVALID_API_KEY" ||
          classified.errorType === "EXPIRED_API_KEY"
        ) {
          setCachedHealth(provider.name, "offline");
          break; // No point retrying — skip to next provider
        }

        // If retryable, log and retry
        if (isRetryableError(error) && retry < config.retryCount) {
          const mode = jsonMode ? "generateJson" : "generateText";
          console.log(
            `[InternIQ AI] ${provider.name} ${mode} failed (${classified.errorType}), retrying (${retry + 1}/${config.retryCount})…`,
          );
          // Small back-off before retry
          if (retry > 0) {
            await new Promise((r) => setTimeout(r, 500 * retry));
          }
          continue;
        }

        // Non-retryable or out of retries — move to next provider
        if (providerIndex < chain.length - 1) {
          console.log(
            `[InternIQ AI] Switching from ${provider.name} to ${chain[providerIndex + 1].name}…`,
          );
        }
        break; // Exit retry loop, try next provider
      }
    }
  }

  // All providers exhausted
  const classified = classifyAiError(lastError ?? new Error("Unknown error"));
  throw classified;
}

/* ------------------------------------------------------------------ */
/*  Public API — same signatures as the old gemini.ts                  */
/* ------------------------------------------------------------------ */

/**
 * Generate plain text using the provider manager.
 * Automatically retries on failures and falls back through the provider chain.
 */
export async function generateText(
  prompt: string,
  options?: ProviderCallOptions,
): Promise<string> {
  return executeWithRetryAndFallback(
    (provider, p, opts) => provider.generateText(p, opts),
    prompt,
    options,
    false,
  );
}

/**
 * Generate a JSON string using the provider manager.
 * Automatically retries on failures and falls back through the provider chain.
 *
 * Usage is identical to the previous `generateJson` from `@/lib/ai/gemini`:
 *
 *   const raw = await generateJson(prompt, { systemInstruction: SYSTEM });
 */
export async function generateJson(
  prompt: string,
  options?: ProviderCallOptions,
): Promise<string> {
  return executeWithRetryAndFallback(
    (provider, p, opts) => provider.generateJson(p, opts),
    prompt,
    options,
    true,
  );
}

/**
 * Check whether a specific provider is currently healthy.
 * Useful for debugging or showing provider status in an admin panel.
 */
export function isProviderHealthy(name: string): ProviderHealth {
  const provider = getProvider(name);
  if (!provider) return "offline";
  return provider.health();
}

/** Return the list of registered provider names. */
export function getAvailableProviders(): string[] {
  return Object.keys(PROVIDERS).filter((name) => {
    const p = getProvider(name);
    return p?.isConfigured() ?? false;
  });
}
