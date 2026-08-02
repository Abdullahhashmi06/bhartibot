import { NextResponse } from "next/server";
import { verifyRecaptchaToken } from "@/lib/recaptcha/server";

/**
 * POST /api/recaptcha/verify
 *
 * Verifies a reCAPTCHA v3 token with Google. Used by client forms before
 * performing sensitive operations (signup, login, OTP, application, ...).
 *
 * Body: { token: string, action?: string }
 *
 * Returns:
 *   200 { ok: true }                        — verification passed
 *   200 { ok: false }                       — verification failed (score, reuse, expiry...)
 *   400 { ok: false }                       — malformed request
 *
 * The secret key never leaves the server. Response intentionally contains no
 * technical detail (score, reason codes) that should reach the user.
 */
export async function POST(request: Request) {
  let body: { token?: unknown; action?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 }
    );
  }

  const { token } = body;

  if (typeof token !== "string") {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 }
    );
  }

  const action = typeof body.action === "string" ? body.action : undefined;

  const result = await verifyRecaptchaToken(token, action);

  if (!result.ok) {
    // Log for analytics/monitoring, but keep the user-facing response generic.
    console.warn("[recaptcha] verification rejected:", result.reason);
  }

  return NextResponse.json({ ok: result.ok });
}
