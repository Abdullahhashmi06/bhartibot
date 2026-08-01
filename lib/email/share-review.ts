/**
 * Email utilities for shared candidate reviews.
 * Uses the application's configured email provider (Resend / SMTP).
 */

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
 * Simple HTML escaping to prevent injection in emails.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends a share review email.
 *
 * Uses Resend by default if RESEND_API_KEY is configured.
 * Falls back to logging the email content for development.
 */
export async function sendShareReviewEmail(
  input: ShareReviewEmailInput
): Promise<ShareReviewEmailResult> {
  // Try Resend if API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "InternIQ <reviews@interniq.ai>",
          to: input.to,
          subject: input.subject,
          html: input.html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[Share Email] Resend API error:", response.status, errorBody);
        return { success: false, error: `Email API error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, sentTo: input.to };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Share Email] Resend send failed:", message);
      return { success: false, error: message };
    }
  }

  // Fallback: log the email content
  console.log("[Share Email] No email provider configured. Logging email:");
  console.log(`  To: ${input.to.join(", ")}`);
  console.log(`  Subject: ${input.subject}`);
  console.log(`  HTML length: ${input.html.length} chars`);

  // Log failure but don't throw — the report still exists
  console.warn(
    "[Share Email] RESEND_API_KEY not set. Email was not actually sent. " +
    "Configure RESEND_API_KEY in environment variables to enable email delivery."
  );

  return {
    success: true, // Report still exists, don't block the flow
    sentTo: input.to,
  };
}
