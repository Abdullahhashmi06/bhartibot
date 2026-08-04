/**
 * Branded "SMTP configuration test" HTML email — used by /api/email/test and
 * the scripts/test-smtp.mjs CLI to verify the SMTP provider configuration.
 */

export function buildTestEmailHtml(): string {
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
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
                ✅ SMTP Configuration Test
              </h1>
              <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                This email was sent from the InternIQ application to verify your
                MailerSend / SMTP setup.
              </p>
              <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
                If you are reading this, your SMTP configuration is working
                correctly. 🎉
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Sent at ${new Date().toISOString()} via Nodemailer over SMTP.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;">
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
