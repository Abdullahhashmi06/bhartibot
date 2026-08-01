/**
 * Email notification service for InternIQ.
 * Sends transactional emails for interview scheduling and rejection notifications.
 * Uses Resend for email delivery when RESEND_API_KEY is set; otherwise logs to console.
 */

import { logEmailFailure } from "./logger";

export interface InterviewEmailParams {
  to: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  interviewType: "online" | "on_site" | "phone";
  meetingLink?: string | null;
  venue?: string | null;
  notes?: string | null;
}

export interface EmailSendResult {
  success: boolean;
  error?: string;
  /** True when no provider key is configured, so the email was logged, not sent. */
  skipped?: boolean;
}

export interface RejectionEmailParams {
  to: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
}

async function sendViaResend(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No provider key configured — log instead of sending so the recruiter can
    // see what would have been sent. Mark `skipped` so the UI can surface that
    // real emails require RESEND_API_KEY.
    console.log("[EMAIL] SKIPPED (RESEND_API_KEY not set). To: " + payload.to + " | Subject: " + payload.subject);
    console.log("[EMAIL] Body preview: " + payload.html.slice(0, 200) + "...");
    return { success: false, skipped: true, error: "Email provider not configured (RESEND_API_KEY missing)." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "InternIQ <notifications@interniq.app>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[EMAIL] Resend API error:", response.status, errBody);
      return { success: false, error: "Resend API returned " + response.status };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend fetch error";
    console.error("[EMAIL] Resend exception:", message);
    return { success: false, error: message };
  }
}

export async function sendInterviewEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  try {
    const { to, applicantName, internshipTitle, organizationName, interviewDate, interviewTime, timezone, interviewType, meetingLink, venue, notes } = params;

    const typeLabel = interviewType === "online" ? "Online" : interviewType === "on_site" ? "On-site" : "Phone";

    // Build location info gracefully — never block email sending over missing fields
    const locationInfo = interviewType === "online" && meetingLink
      ? `Meeting Link: <a href="${meetingLink}" style="color:#17C6B5;">${meetingLink}</a>`
      : interviewType === "online"
      ? "Meeting link will be shared closer to the date."
      : interviewType === "on_site" && venue
      ? `Venue: ${venue}`
      : "Details will be shared closer to the date.";

    const subject = "Interview Scheduled: " + internshipTitle + " at " + organizationName;
    const html = buildInterviewEmailHtml({
      applicantName, internshipTitle, organizationName,
      interviewDate, interviewTime, timezone,
      typeLabel, locationInfo, notes
    });

    const result = await sendViaResend({ to, subject, html });

    if (!result.success) {
      logEmailFailure(to, "Interview email failed: " + (result.error || "Unknown"));
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[EMAIL] Failed to send interview notification:", message);
    logEmailFailure(params.to, "Interview email exception: " + message);
    return { success: false, error: message };
  }
}

/**
 * Send a generic, professional rejection email to an applicant.
 * This email is intentionally NOT personalized with AI scores, evidence,
 * or specific reasons — it reads the same for every rejected applicant.
 */
export async function sendRejectionEmail(
  params: RejectionEmailParams
): Promise<EmailSendResult> {
  try {
    const { to, applicantName, internshipTitle, organizationName } = params;

    const subject = "Update on Your Application to " + internshipTitle + " at " + organizationName;
    const html = buildRejectionEmailHtml({
      applicantName,
      internshipTitle,
      organizationName,
    });

    const result = await sendViaResend({ to, subject, html });

    if (!result.success) {
      logEmailFailure(to, "Rejection email failed: " + (result.error || "Unknown"));
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[EMAIL] Failed to send rejection notification:", message);
    logEmailFailure(params.to, "Rejection email exception: " + message);
    return { success: false, error: message };
  }
}

function buildInterviewEmailHtml(opts: {
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  typeLabel: string;
  locationInfo: string;
  notes?: string | null;
}): string {
  const dateRow = "<tr><td style='padding:6px 0;font-size:12px;color:#A4B0C2;text-transform:uppercase;'>Date</td><td style='font-size:14px;color:#16233B;font-weight:600;'>" + opts.interviewDate + "</td></tr>";
  const timeRow = "<tr><td style='padding:6px 0;font-size:12px;color:#A4B0C2;text-transform:uppercase;'>Time</td><td style='font-size:14px;color:#16233B;font-weight:600;'>" + opts.interviewTime + " (" + opts.timezone + ")</td></tr>";
  const typeRow = "<tr><td style='padding:6px 0;font-size:12px;color:#A4B0C2;text-transform:uppercase;'>Type</td><td style='font-size:14px;color:#16233B;font-weight:600;'>" + opts.typeLabel + "</td></tr>";
  const locRow = "<tr><td style='padding:6px 0;font-size:12px;color:#A4B0C2;text-transform:uppercase;'>Location</td><td style='font-size:14px;color:#16233B;font-weight:600;'>" + opts.locationInfo + "</td></tr>";
  const notesRow = opts.notes ? "<tr><td style='padding:6px 0;font-size:12px;color:#A4B0C2;text-transform:uppercase;'>Notes</td><td style='font-size:14px;color:#6D7A92;'>" + opts.notes + "</td></tr>" : "";
  const details = dateRow + timeRow + typeRow + locRow + notesRow;

  return "<!DOCTYPE html><html><head><meta charset='utf-8'/></head><body style='margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,sans-serif;'><table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:32px 16px;'><tr><td align='center'><table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;background:#fff;border-radius:16px;'><tr><td style='background:linear-gradient(135deg,#17C6B5,#6F52ED);padding:32px;text-align:center;'><h1 style='margin:0;font-size:20px;color:#fff;'>Interview Scheduled</h1><p style='margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);'>Your interview for " + opts.internshipTitle + "</p></td></tr><tr><td style='padding:32px;'><p style='font-size:16px;color:#16233B;font-weight:600;'>Dear " + opts.applicantName + ",</p><p style='font-size:14px;color:#6D7A92;'>Your interview for <strong>" + opts.internshipTitle + "</strong> at <strong>" + opts.organizationName + "</strong> has been scheduled.</p><table style='margin:24px 0;background:#F7F9FC;border-radius:12px;padding:20px;width:100%;'>" + details + "</table><p style='font-size:14px;color:#6D7A92;'>Best of luck with your interview!</p></td></tr></table></td></tr></table></body></html>";
}

function buildRejectionEmailHtml(opts: {
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
}): string {
  return "<!DOCTYPE html><html><head><meta charset='utf-8'/></head><body style='margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,sans-serif;'><table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:32px 16px;'><tr><td align='center'><table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;background:#fff;border-radius:16px;'><tr><td style='background:linear-gradient(135deg,#6F52ED,#475569);padding:32px;text-align:center;'><h1 style='margin:0;font-size:20px;color:#fff;'>Application Update</h1><p style='margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);'>" + opts.internshipTitle + " at " + opts.organizationName + "</p></td></tr><tr><td style='padding:32px;'><p style='font-size:16px;color:#16233B;font-weight:600;'>Dear " + opts.applicantName + ",</p><p style='font-size:14px;color:#6D7A92;'>Thank you for applying to <strong>" + opts.internshipTitle + "</strong> at <strong>" + opts.organizationName + "</strong>. We truly appreciate the time and effort you invested in your application.</p><p style='font-size:14px;color:#6D7A92;'>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p><p style='font-size:14px;color:#6D7A92;'>We wish you the very best in your future endeavors and encourage you to apply again for opportunities that match your skills and interests.</p><table width='100%' style='margin-top:24px;padding-top:20px;border-top:1px solid #E2E8F0;'><tr><td style='font-size:12px;color:#94A3B8;'>Best regards,<br/><strong style='color:#16233B;'>" + opts.organizationName + " Recruitment Team</strong></td></tr></table></td></tr></table></td></tr></table><table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:16px;font-size:11px;color:#94A3B8;'>This is an automated message from InternIQ. Please do not reply to this email.</td></tr></table></body></html>";
}

