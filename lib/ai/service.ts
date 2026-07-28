import { classifyAiError, AiError } from "@/lib/ai/errors";
import type { AiServiceResult } from "@/lib/ai/errors";

const DEFAULT_AI_TIMEOUT_MS = 90_000;

/**
 * Runs an AI operation and returns a structured result instead of throwing.
 * Logs server-side details; never exposes stack traces to callers.
 */
export async function runAiOperation<T>(
  context: string,
  operation: () => Promise<T>,
  options?: { timeoutMs?: number }
): Promise<AiServiceResult<T>> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS;

  try {
    const data = await withTimeout(operation(), timeoutMs);
    return { success: true, data };
  } catch (error) {
    const classified = classifyAiError(error);
    console.error(`[InternIQ AI] ${context}:`, classified.logDetail);
    return classified.toFailure();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new AiError(
          "NETWORK_TIMEOUT",
          `AI operation timed out after ${ms}ms`
        )
      );
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
