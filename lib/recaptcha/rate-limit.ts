import "server-only";

/**
 * Lightweight in-memory IP rate limiter for the reCAPTCHA verification
 * endpoint.
 *
 * No Redis / Upstash / paid services: a per-process Map with a sliding-window
 * counter is plenty for a verification endpoint. On serverless platforms
 * (Vercel) each lambda instance keeps its own map, so this is a best-effort
 * per-instance limiter rather than a global one — it still meaningfully slows
 * abusive bursts and is trivially replaceable later.
 *
 * Environment variables (all optional):
 *   RECAPTCHA_RATE_LIMIT_MAX         max requests per window per IP (default 15)
 *   RECAPTCHA_RATE_LIMIT_WINDOW_MS   window length in ms (default 60_000)
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

/** Bound the map so an IP flood can never grow memory without limit. */
const MAX_BUCKETS = 10_000;

function getConfig() {
  const rawMax = Number.parseInt(
    process.env.RECAPTCHA_RATE_LIMIT_MAX || "",
    10
  );
  const rawWindow = Number.parseInt(
    process.env.RECAPTCHA_RATE_LIMIT_WINDOW_MS || "",
    10
  );
  return {
    max: Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 15,
    windowMs:
      Number.isFinite(rawWindow) && rawWindow > 0 ? rawWindow : 60_000,
  };
}

/**
 * Best-effort client IP extraction. Vercel and most proxies populate
 * `x-forwarded-for`; the first entry is the original client. Falls back to
 * `x-real-ip` and finally "unknown" (dev / localhost), which is fine — the
 * limiter still caps shared-IP traffic, just groups it together.
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
 * Returns whether the request is allowed, plus seconds until the window resets
 * when it is not. Uses a sliding window reset on first request in the window.
 */
export function rateLimitCheck(
  ip: string
): { allowed: true; retryAfterSeconds?: undefined } | { allowed: false; retryAfterSeconds: number } {
  const { max, windowMs } = getConfig();
  const now = Date.now();

  // Opportunistic cleanup: drop expired buckets. Runs on every call but is O(n)
  // only when the map is large; keeps memory from growing unbounded.
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
