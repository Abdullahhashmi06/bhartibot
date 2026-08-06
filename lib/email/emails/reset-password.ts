import {
  baseLayout,
  button,
  divider,
  escapeHtml,
} from "@/lib/email/templates";
import { sendEmail, type SendEmailResult } from "@/lib/email/smtp";

/**
 * Builds the branded InternIQ password-reset email with a primary reset
 * button, a backup plain link, and a security note.
 */
export function buildResetPasswordEmailHtml(opts: {
  resetUrl: string;
  /** Expiry window in minutes for the reset link. */
  expiresMinutes?: number;
}): string {
  const expiresMinutes = opts.expiresMinutes ?? 60;

  const content = `
    <tr>
      <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
          Reset your password
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
          We received a request to reset the password for your InternIQ
          account. Click the button below to choose a new password. This link
          expires in <strong style="color:#0b1f3a;">${expiresMinutes} minutes</strong>.
        </p>
        ${button(opts.resetUrl, "Reset Password")}
        <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.6;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:0;font-size:12px;color:#0b1f3a;word-break:break-all;">
          ${escapeHtml(opts.resetUrl)}
        </p>
      </td>
    </tr>
    ${divider()}
    <tr>
      <td>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
          🔒 If you didn't request a password reset, you can safely ignore this
          email — your password will not be changed.
        </p>
      </td>
    </tr>`;

  return baseLayout({ title: "Reset your InternIQ password", content });
}

/** Sends a branded password-reset email to one recipient. */
export async function sendResetPasswordEmail(opts: {
  to: string;
  resetUrl: string;
  expiresMinutes?: number;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "Reset your InternIQ password",
    html: buildResetPasswordEmailHtml(opts),
    text: `Reset your InternIQ password here: ${opts.resetUrl} (expires in ${opts.expiresMinutes ?? 60} minutes). If you didn't request this, ignore this email.`,
  });
}
