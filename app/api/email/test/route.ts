import { NextResponse } from "next/server";
import {
  sendEmail,
  isSmtpConfigured,
  buildTestEmailHtml,
} from "@/lib/email";

/**
 * POST /api/email/test
 *
 * Sends a single branded test email through the configured SMTP provider
 * (MailerSend / any SMTP) so the setup can be verified end-to-end.
 *
 * Request body:  { "to": "someone@example.com" }
 *
 * Response:
 *   200 { ok: true, messageId?, accepted? }        — delivered
 *   200 { ok: false, skipped: true, error }        — SMTP not configured (dev)
 *   400 { ok: false, error }                       — missing/invalid "to"
 *   403 { ok: false, error }                       — production without secret
 *   503 { ok: false, error }                       — SMTP send failed
 *
 * Security: in production this endpoint requires the `x-test-secret` header to
 * match EMAIL_TEST_SECRET. If EMAIL_TEST_SECRET is not set, the endpoint is
 * disabled in production (dev/CI are unaffected) so it can never become an
 * open email-relay / spam vector.
 */
export async function POST(request: Request) {
  // Production guard — never allow an unauthenticated email relay.
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.EMAIL_TEST_SECRET;
    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Test endpoint is disabled in production. Set EMAIL_TEST_SECRET to enable it.",
        },
        { status: 403 }
      );
    }
    const provided = request.headers.get("x-test-secret");
    if (!provided || provided !== secret) {
      return NextResponse.json(
        { ok: false, error: "Invalid or missing x-test-secret header." },
        { status: 403 }
      );
    }
  }

  let body: { to?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!to) {
    return NextResponse.json(
      { ok: false, error: '"to" (recipient email) is required.' },
      { status: 400 }
    );
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      error:
        "SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing). Add the SMTP_* env vars and redeploy.",
    });
  }

  const result = await sendEmail({
    to,
    subject: "InternIQ — SMTP Configuration Test",
    html: buildTestEmailHtml(),
    text: "This is a test email from InternIQ. If you can read this, your SMTP configuration is working correctly.",
  });

  if (!result.success) {
    return NextResponse.json(
      {
        ok: false,
        skipped: result.skipped ?? undefined,
        error: result.error || "Email could not be sent.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId ?? null,
    accepted: result.accepted ?? null,
  });
}
