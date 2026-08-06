/**
 * InternIQ email template system.
 *
 * Reusable HTML email components — Stripe/Linear/Notion-style modern SaaS
 * design, built with table layouts for maximum email-client compatibility.
 *
 * Colors follow the InternIQ brand (teal/emerald greens + dark navy):
 *   --teal:        #17C6B5
 *   --emerald:     #10B981
 *   --navy:        #0b1f3a
 *   --slate:       #475569
 *   --muted:       #94a3b8
 *   --bg:          #f1f5f9
 */

export const EMAIL_COLORS = {
  teal: "#17C6B5",
  emerald: "#10B981",
  navy: "#0b1f3a",
  slate: "#475569",
  muted: "#94a3b8",
  bg: "#f1f5f9",
  border: "#e2e8f0",
  white: "#ffffff",
  danger: "#EF4444",
  amber: "#F59E0B",
} as const;

/** Escape user-provided text before injecting into HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ── Header / Footer ─────────────────────────────────────────────────── */

export function emailHeader(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
      <tr>
        <td style="background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);border-radius:12px;padding:8px 18px;">
          <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
        </td>
      </tr>
    </table>`;
}

export function emailFooter(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:${EMAIL_COLORS.muted};">
            <strong style="color:${EMAIL_COLORS.slate};">InternIQ</strong> · AI-Powered Internship Recruitment Platform
          </p>
          <!-- Social links (placeholders) -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto;">
            <tr>
              <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/interniq" style="font-size:11px;color:${EMAIL_COLORS.teal};text-decoration:none;font-weight:600;">LinkedIn</a></td>
              <td style="padding:0 8px;color:#cbd5e1;">·</td>
              <td style="padding:0 8px;"><a href="https://x.com/interniq" style="font-size:11px;color:${EMAIL_COLORS.teal};text-decoration:none;font-weight:600;">X / Twitter</a></td>
              <td style="padding:0 8px;color:#cbd5e1;">·</td>
              <td style="padding:0 8px;"><a href="https://github.com/interniq" style="font-size:11px;color:${EMAIL_COLORS.teal};text-decoration:none;font-weight:600;">GitHub</a></td>
            </tr>
          </table>
          <p style="margin:0 0 10px;font-size:11px;color:${EMAIL_COLORS.muted};line-height:1.6;">
            This is an automated email. Please do not reply to this message.<br/>
            Need help? Contact <a href="mailto:support@interniq.app" style="color:${EMAIL_COLORS.teal};text-decoration:underline;">support@interniq.app</a>
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">
            © ${new Date().getFullYear()} InternIQ. All rights reserved.
          </p>
        </td>
      </tr>
    </table>`;
}

/* ── Reusable components ─────────────────────────────────────────────── */

export function button(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function divider(): string {
  return `<tr><td style="padding:24px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${EMAIL_COLORS.border};"></td></tr></table></td></tr>`;
}

/** Large centered OTP code box. */
export function otpBox(code: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background:#f0fdfa;border:2px dashed ${EMAIL_COLORS.teal};border-radius:16px;padding:20px;">
          <span style="font-size:40px;font-weight:800;letter-spacing:0.35em;color:${EMAIL_COLORS.navy};font-family:'Courier New',monospace;">
            ${escapeHtml(code)}
          </span>
        </td>
      </tr>
    </table>`;
}

/** Tone: "success" | "info" | "warning" | "danger". */
export function statusBadge(label: string, tone: "success" | "info" | "warning" | "danger" = "success"): string {
  const styles: Record<string, string> = {
    success: `background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;`,
    info: `background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;`,
    warning: `background:#fffbeb;color:#b45309;border:1px solid #fde68a;`,
    danger: `background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;`,
  };
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="${styles[tone]}border-radius:999px;padding:6px 16px;">
          <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;">${escapeHtml(label)}</span>
        </td>
      </tr>
    </table>`;
}

export function companyCard(opts: {
  companyName: string;
  internshipTitle: string;
  location?: string | null;
}): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid ${EMAIL_COLORS.border};border-radius:14px;margin:20px 0;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${EMAIL_COLORS.navy};">${escapeHtml(opts.companyName)}</p>
          <p style="margin:0 0 4px;font-size:14px;color:${EMAIL_COLORS.slate};font-weight:600;">${escapeHtml(opts.internshipTitle)}</p>
          ${opts.location ? `<p style="margin:0;font-size:12px;color:${EMAIL_COLORS.muted};">📍 ${escapeHtml(opts.location)}</p>` : ""}
        </td>
      </tr>
    </table>`;
}

export function callToAction(href: string, label: string): string {
  return button(href, label);
}

/** Security note footer block used by auth emails. */
export function securityNote(): string {
  return `
    <tr><td style="padding:16px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;">
        <tr><td style="padding:14px 18px;font-size:12px;color:#92400e;line-height:1.6;">
          <strong>🔒 Security note:</strong> Never share this code with anyone.
          InternIQ will never ask you for your passcode or password.
        </td></tr>
      </table>
    </td></tr>`;
}

/* ── Base layout ─────────────────────────────────────────────────────── */

export function baseLayout(opts: {
  title: string; // <title> tag
  content: string; // inner HTML rows (td children)
  wide?: boolean;
}): string {
  const innerWidth = opts.wide ? 560 : 480;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_COLORS.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="${innerWidth}" cellpadding="0" cellspacing="0" style="max-width:${innerWidth}px;width:100%;">
          <!-- Logo -->
          <tr><td style="padding-bottom:24px;text-align:center;">${emailHeader()}</td></tr>
          <!-- Content card -->
          <tr>
            <td style="background:${EMAIL_COLORS.white};border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${opts.content}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr><td>${emailFooter()}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
