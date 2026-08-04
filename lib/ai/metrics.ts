/**
 * AI Metrics — lightweight console-based telemetry.
 *
 * Tracks per-request provider usage, response times, successes,
 * failures, retries, and fallback events.
 *
 * All data is logged to the server console; no database or external
 * service is required.
 */

export interface AiRequestMetric {
  /** Provider name used for this request. */
  provider: string;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Whether the request succeeded. */
  success: boolean;
  /** Error type on failure, or undefined on success. */
  errorType?: string;
  /** Number of retries on the preferred provider. */
  retryCount: number;
  /** Whether a fallback provider was used. */
  usedFallback: boolean;
  /** Human-readable status label. */
  status: "Success" | "Failure" | "Fallback";
}

let metrics: AiRequestMetric[] = [];

const RETENTION_LIMIT = 200;

/** Record a single AI request metric. */
export function recordMetric(metric: AiRequestMetric): void {
  metrics.push(metric);
  if (metrics.length > RETENTION_LIMIT) {
    metrics = metrics.slice(metrics.length - RETENTION_LIMIT);
  }

  const { provider, durationMs, status, errorType, retryCount, usedFallback } =
    metric;

  const logLine = [
    `[InternIQ AI]`,
    `Provider: ${provider}`,
    `Duration: ${(durationMs / 1000).toFixed(2)}s`,
    `Status: ${status}`,
    errorType ? `Reason: ${errorType}` : null,
    retryCount > 0 ? `Retries: ${retryCount}` : null,
    usedFallback ? `⚠ Used fallback` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  console.log(logLine);
}
