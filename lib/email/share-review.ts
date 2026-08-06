/**
 * Email utilities for shared candidate reviews.
 * Uses the centralized SMTP email service in lib/email/smtp.
 */

import { sendEmail } from "./smtp";
import { escapeHtml } from "./templates";

export interface ShareReviewEmailInput {
  to: string[];
  subject: string;
  html: string;
}

export interface ShareReviewEmailResult {
  success: boolean;
  sentTo?: string[];
  error?: string;
}

/**
 * Builds a professional HTML email for sharing a candidate review.
 */
export function buildShareReviewEmailHtml({
  applicantName,
  internshipTitle,
  organizationName,
  reviewUrl,
  expiresAt,
}: {
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  reviewUrl: string;
  expiresAt: string | null;
}): string {
  const expirationText = expiresAt
    ? `This review will expire on ${new Date(expiresAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}.`
    : "This review link does not expire.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Logo + Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#17C6B5 0%,#6F52ED 100%);border-radius:10px;padding:8px 16px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
                      Candidate Review: ${escapeHtml(applicantName)}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
                      <strong style="color:#0b1f3a;">Position:</strong> ${escapeHtml(internshipTitle)}
                    </p>
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
                      <strong style="color:#0b1f3a;">Organization:</strong> ${escapeHtml(organizationName)}
                    </p>
                    <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
                      <strong style="color:#0b1f3a;">${expirationText}</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px;">
                      <tr>
                        <td style="text-align:center;">
                          <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
                            Click the button below to view the complete AI-powered candidate evaluation report.
                          </p>
                          <a href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#17C6B5 0%,#6F52ED 100%);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.2px;">
                            Open Candidate Review
                          </a>
                          <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;word-break:break-all;">
                            Or copy this link:<br/>
                            <span style="color:#0b1f3a;">${escapeHtml(reviewUrl)}</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">
                Shared securely using <strong style="color:#64748b;">InternIQ</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                AI-Powered Internship Recruitment Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a share review email via the centralized SMTP service.
 */
export async function sendShareReviewEmail(
  input: ShareReviewEmailInput
): Promise<ShareReviewEmailResult> {
  const result = await sendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (result.success) {
    return { success: true, sentTo: input.to };
  }

  // When SMTP is not configured, preserve the non-blocking flow.
  if (result.skipped) {
    return { success: true, sentTo: input.to };
  }

  return { success: false, error: result.error ?? "Email sending failed." };
}
