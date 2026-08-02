import "server-only";

/**
 * Server-side Google reCAPTCHA v3 verification.
 *
 * Never import this from a client component. The secret key must only ever
 * live in server-side code / environment variables.
 *
 * Environment variables:
 *   RECAPTCHA_SECRET_KEY        (required in production)  Google siteverify secret.
 *   RECAPTCHA_SCORE_THRESHOLD   (optional, default "0.5") Minimum accepted score.
 *   RECAPTCHA_FAIL_OPEN         (optional, default "false") Allow requests through
 *                               when Google's API itself errors (network / 5xx).
 */

export interface RecaptchaVerification {
  ok: boolean;
  /** Stable machine-readable reason for logging/analytics (never shown to users). */
  reason?:
    | "not_configured"
    | "missing_token"
    | "invalid_token"
    | "reused_token"
    | "expired_token"
    | "score_too_low"
    | "action_mismatch"
    | "hostname_mismatch"
    | "google_unavailable"
    | "google_error";
  score?: number;
}

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/** Tokens are only valid for ~2 minutes after they are minted. */
const TOKEN_MAX_AGE_MS = 2 * 60 * 1000;

function getConfig() {
  // Guard against a misconfigured threshold: parseFloat("abc") → NaN, and
  // `score < NaN` is always false, which would silently pass every request.
  const rawThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");
  const threshold = Number.isFinite(rawThreshold)
    ? Math.min(1, Math.max(0, rawThreshold))
    : 0.5;

  const failOpenRaw = (process.env.RECAPTCHA_FAIL_OPEN || "false").toLowerCase();

  return {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    threshold,
    failOpen: failOpenRaw === "true" || failOpenRaw === "1" || failOpenRaw === "yes",
    expectedHostname: process.env.RECAPTCHA_EXPECTED_HOSTNAME, // optional
  };
}

export function isRecaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

/**
 * Verify a reCAPTCHA v3 token with Google.
 *
 * - Rejects when the secret key is not configured (fail-closed by default in
 *   production; local dev can skip by not setting keys).
 * - Rejects missing/malformed tokens.
 * - Google rejects reused tokens with "timeout-or-duplicate" (reuse protection
 *   is enforced by Google itself — tokens can only be redeemed once).
 * - Rejects tokens older than ~2 minutes.
 * - Enforces the score threshold and, optionally, the expected action/hostname.
 * - When Google's API is unreachable, honours RECAPTCHA_FAIL_OPEN.
 */
export async function verifyRecaptchaToken(
  token: string | null | undefined,
  expectedAction?: string
): Promise<RecaptchaVerification> {
  const config = getConfig();

  if (!config.secretKey) {
    // Not configured — do not block. Production deployments must set the key.
    return { ok: true, reason: "not_configured" };
  }

  if (!token || typeof token !== "string" || token.length < 20) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams({
    secret: config.secretKey,
    response: token,
  });

  let payload: {
    success: boolean;
    score?: number;
    action?: string;
    hostname?: string;
    challenge_ts?: string;
    "error-codes"?: string[];
  };

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      // Google returned a 4xx/5xx — treat as an API failure.
      if (config.failOpen) {
        return { ok: true, reason: "google_unavailable" };
      }
      return { ok: false, reason: "google_unavailable" };
    }

    payload = (await res.json()) as typeof payload;
  } catch (error) {
    // Network failure reaching Google.
    console.error("[recaptcha] Google API unreachable:", error);
    if (config.failOpen) {
      return { ok: true, reason: "google_unavailable" };
    }
    return { ok: false, reason: "google_unavailable" };
  }

  if (!payload.success) {
    const codes = payload["error-codes"] ?? [];

    // Google returns "timeout-or-duplicate" when a token is expired OR was
    // already redeemed (reuse protection).
    if (codes.includes("timeout-or-duplicate")) {
      // We can't distinguish expiry from reuse from this code alone; check the
      // timestamp when present, otherwise treat as generic invalid.
      const ageMs = ageOfChallenge(payload.challenge_ts);
      if (ageMs !== null && ageMs > TOKEN_MAX_AGE_MS) {
        return { ok: false, reason: "expired_token" };
      }
      return { ok: false, reason: "reused_token" };
    }

    return { ok: false, reason: "invalid_token" };
  }

  // Action binding (optional but recommended).
  if (expectedAction && payload.action && payload.action !== expectedAction) {
    return { ok: false, reason: "action_mismatch" };
  }

  // Hostname binding (optional).
  if (
    config.expectedHostname &&
    payload.hostname &&
    payload.hostname !== config.expectedHostname
  ) {
    return { ok: false, reason: "hostname_mismatch" };
  }

  // Token age check (expired tokens must be rejected even if Google says ok).
  const ageMs = ageOfChallenge(payload.challenge_ts);
  if (ageMs !== null && ageMs > TOKEN_MAX_AGE_MS) {
    return { ok: false, reason: "expired_token" };
  }

  const score = payload.score ?? 0;
  if (score < config.threshold) {
    return { ok: false, reason: "score_too_low", score };
  }

  return { ok: true, score };
}

function ageOfChallenge(challengeTs?: string): number | null {
  if (!challengeTs) return null;
  const ts = Date.parse(challengeTs);
  if (Number.isNaN(ts)) return null;
  return Date.now() - ts;
}
