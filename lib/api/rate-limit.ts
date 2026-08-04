import "server-only";

import { NextResponse } from "next/server";

/**
 * Reusable in-memory IP rate limiter for cost-bearing endpoints (AI calls,
 * email sends, etc.). Same lightweight design as the reCAPTCHA limiter:
 * no Redis/Upstash — a per-process Map with a sliding window. On serverless
 * platforms (Vercel) each lambda keeps its own map, so this is best-effort
 * per-instance limiting — it still stops single-IP abuse bursts and is
 * trivially replaceable with a shared store later.
 *
 * Environment variables (all optional):
 *   AI_RATE_LIMIT_MAX         max requests per window per IP (default 30)
 *   AI_RATE_LIMIT_WINDOW_MS   window length in ms (default 60_000)
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

/** Bound the map so an IP flood can never grow memory without limit. */
const MAX_BUCKETS = 10_000;

function getConfig() {
  const rawMax = Number.parseInt(process.env.AI_RATE_LIMIT_MAX || "", 10);
  const rawWindow = Number.parseInt(
    process.env.AI_RATE_LIMIT_WINDOW_MS || "",
    10
  );
  return {
    max: Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 30,
    windowMs:
      Number.isFinite(rawWindow) && rawWindow > 0 ? rawWindow : 60_000,
  };
}

/**
 * Best-effort client IP extraction. Vercel and most proxies populate
 * `x-forwarded-for`; the first entry is the original client. Falls back to
 * `x-real-ip` and finally "unknown" (dev / localhost).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Returns whether the request is allowed, plus seconds until the window
 * resets when it is not. Uses a sliding window reset on first request.
 */
export function checkRateLimit(
  ip: string,
  override?: { max?: number; windowMs?: number }
):
  | { allowed: true; retryAfterSeconds?: undefined }
  | { allowed: false; retryAfterSeconds: number } {
  const config = getConfig();
  const max = override?.max ?? config.max;
  const windowMs = override?.windowMs ?? config.windowMs;
  const now = Date.now();

  // Opportunistic cleanup: drop expired buckets (only O(n) when the map is
  // large; keeps memory from growing unbounded).
  if (buckets.size > MAX_BUCKETS) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= windowMs) buckets.delete(key);
    }
  }

  const existing = buckets.get(ip);
  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  existing.count += 1;
  if (existing.count > max) {
    const retryAfterMs = existing.windowStart + windowMs - now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { allowed: true };
}

/**
 * Convenience guard for route handlers: returns a 429 NextResponse when the
 * caller's IP exceeded the limit, otherwise null (proceed).
 */
export function rateLimitOrNull(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }
  return null;
}
