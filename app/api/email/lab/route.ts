import { NextResponse } from "next/server";
import {
  sendOtpEmail,
  sendResetPasswordEmail,
  sendShortlistedEmail,
  sendRejectedEmail,
  sendInterviewInvitationEmail,
  sendInterviewReminderEmail,
  isSmtpConfigured,
} from "@/lib/email";

type EmailTemplate =
  | "otp"
  | "reset"
  | "shortlisted"
  | "rejected"
  | "interview"
  | "reminder";

const SAMPLE_INTERVIEW = {
  internshipTitle: "AI Engineering Intern",
  organizationName: "Acme Labs",
  interviewDate: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
  interviewTime: "02:30 PM",
  timezone: "America/New_York",
  interviewType: "online" as const,
  meetingLink: "https://meet.google.com/interniq-demo",
  venue: null,
  notes: "Please bring your portfolio and a list of questions.",
  interviewerName: "Sarah Ahmed",
};

/**
 * POST /api/email/lab
 *
 * Developer-only endpoint for previewing the InternIQ email templates by
 * sending a real email to any address.
 *
 * Body: { "to": "you@example.com", "template": "otp|reset|shortlisted|rejected|interview|reminder" }
 *
 * Security: disabled in production unless EMAIL_TEST_SECRET is set and the
 * `x-test-secret` header matches (same policy as /api/email/test) — prevents
 * the endpoint from becoming an open email-relay / spam vector.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.EMAIL_TEST_SECRET;
    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Email lab is disabled in production. Set EMAIL_TEST_SECRET to enable it.",
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

  let body: { to?: unknown; template?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const template = typeof body.template === "string" ? body.template : "";
  const validTemplates: EmailTemplate[] = [
    "otp",
    "reset",
    "shortlisted",
    "rejected",
    "interview",
    "reminder",
  ];

  if (!to) {
    return NextResponse.json(
      { ok: false, error: '"to" (recipient email) is required.' },
      { status: 400 }
    );
  }
  if (!validTemplates.includes(template as EmailTemplate)) {
    return NextResponse.json(
      {
        ok: false,
        error: `"template" must be one of: ${validTemplates.join(", ")}.`,
      },
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

  let result;
  switch (template as EmailTemplate) {
    case "otp":
      result = await sendOtpEmail({
        to,
        code: "482913",
        purpose: "log in to your InternIQ account",
      });
      break;
    case "reset":
      result = await sendResetPasswordEmail({
        to,
        resetUrl: "https://app.interniq.com/auth/reset-password?code=DEMO",
      });
      break;
    case "shortlisted":
      result = await sendShortlistedEmail({
        to,
        applicantName: "Alex Doe",
        internshipTitle: SAMPLE_INTERVIEW.internshipTitle,
        organizationName: SAMPLE_INTERVIEW.organizationName,
        dashboardUrl: "https://app.interniq.com/applicant",
      });
      break;
    case "rejected":
      result = await sendRejectedEmail({
        to,
        applicantName: "Alex Doe",
        internshipTitle: SAMPLE_INTERVIEW.internshipTitle,
        organizationName: SAMPLE_INTERVIEW.organizationName,
        exploreUrl: "https://app.interniq.com/applicant/internships",
      });
      break;
    case "interview":
      result = await sendInterviewInvitationEmail({
        to,
        applicantName: "Alex Doe",
        ...SAMPLE_INTERVIEW,
      });
      break;
    case "reminder":
      result = await sendInterviewReminderEmail({
        to,
        applicantName: "Alex Doe",
        ...SAMPLE_INTERVIEW,
      });
      break;
  }

  if (!result || !result.success) {
    return NextResponse.json(
      {
        ok: false,
        skipped: result?.skipped ?? undefined,
        error: result?.error || "Email could not be sent.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    template,
    messageId: result.messageId ?? null,
    accepted: result.accepted ?? null,
  });
}
