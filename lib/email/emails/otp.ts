import {
  baseLayout,
  button,
  divider,
  escapeHtml,
  otpBox,
  securityNote,
} from "@/lib/email/templates";
import { sendEmail, type SendEmailResult } from "@/lib/email/smtp";

/**
 * Builds the branded InternIQ OTP email.
 *
 * Used by the app for any app-generated passcode (and available as the exact
 * HTML to paste into Supabase's custom-SMTP email templates for auth OTPs).
 */
export function buildOtpEmailHtml(opts: {
  code: string;
  /** Human label for what the code unlocks, e.g. "log in to your account". */
  purpose?: string;
  /** Expiry window in minutes. */
  expiresMinutes?: number;
}): string {
  const purpose = opts.purpose ?? "complete your request";
  const expiresMinutes = opts.expiresMinutes ?? 10;

  const content = `
    <tr>
      <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
          Your verification code
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
          Hello,<br/>
          Use the code below to <strong style="color:#0b1f3a;">${escapeHtml(purpose)}</strong>.
          This code is valid for the next <strong style="color:#0b1f3a;">${expiresMinutes} minutes</strong>.
        </p>
        ${otpBox(opts.code)}
        <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </td>
    </tr>
    ${divider()}
    ${securityNote()}`;

  return baseLayout({ title: "Your InternIQ verification code", content });
}

/** Sends a branded OTP email to one recipient. */
export async function sendOtpEmail(opts: {
  to: string;
  code: string;
  purpose?: string;
  expiresMinutes?: number;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "Your InternIQ verification code",
    html: buildOtpEmailHtml(opts),
    text: `Your InternIQ verification code is ${opts.code}. It expires in ${opts.expiresMinutes ?? 10} minutes. If you didn't request this, ignore this email.`,
  });
}
