import "server-only";

/**
 * Centralized SMTP email service for InternIQ.
 *
 * Uses Nodemailer over SMTP (e.g. MailerSend). Credentials are read
 * EXCLUSIVELY from environment variables — never hardcoded:
 *
 *   SMTP_HOST   — e.g. smtp.mailersend.net
 *   SMTP_PORT   — 587 (STARTTLS) or 465 (implicit SSL). Default 587.
 *   SMTP_USER   — SMTP username / API token
 *   SMTP_PASS   — SMTP password / API secret
 *   SMTP_FROM   — sender address, e.g. "InternIQ <noreply@yourdomain.com>"
 *
 * Serverless-safe: a fresh transporter is created per send (no long-lived
 * pooled connection), and every failure is caught and returned as a result
 * object instead of thrown, so callers (route handlers, server actions)
 * never crash on a transient mail error.
 */

import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface EmailAttachment {
  filename: string;
  /** UTF-8 string content (e.g. an .ics calendar file) or raw Buffer. */
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  /** Optional file attachments (e.g. .ics calendar invites). */
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  /** True when no SMTP credentials are configured — email was logged, not sent. */
  skipped?: boolean;
  error?: string;
  messageId?: string;
  accepted?: string[];
}

const DEFAULT_PORT = 587;

/**
 * Reads SMTP config from environment. Returns null (never throws) when
 * credentials are missing, so callers can degrade gracefully.
 */
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  const rawPort = Number.parseInt(process.env.SMTP_PORT || "", 10);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : DEFAULT_PORT;

  return {
    host,
    port,
    user,
    pass,
    from:
      process.env.SMTP_FROM?.trim() ||
      `InternIQ <${user.includes("@") ? user : "no-reply@interniq.app"}>`,
  };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

/** Basic sanity check for a single email address. */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Validates the address list and returns a cleaned array or an error. */
function validateRecipients(
  recipients: string | string[],
  field: string
): { ok: true; list: string[] } | { ok: false; error: string } {
  const list = Array.isArray(recipients) ? recipients : [recipients];
  if (list.length === 0) {
    return { ok: false, error: `"${field}" is required.` };
  }
  const cleaned = list.map((r) => r.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { ok: false, error: `"${field}" is empty.` };
  }
  if (cleaned.some((r) => !isValidEmail(r))) {
    return { ok: false, error: `"${field}" contains an invalid email address.` };
  }
  return { ok: true, list: cleaned };
}

/**
 * Sends an HTML (and/or plain-text) email via SMTP.
 *
 * Never throws — returns a result object. When SMTP is not configured, the
 * email content is logged (so developers can inspect it) and `skipped: true`
 * is returned.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  // Validate input up-front (TypeScript-safe, fail fast with a clean message).
  if (!input.subject || !input.subject.trim()) {
    return { success: false, error: '"subject" is required.' };
  }
  if (!input.html || !input.html.trim()) {
    return { success: false, error: '"html" is required.' };
  }
  const toCheck = validateRecipients(input.to, "to");
  if (!toCheck.ok) return { success: false, error: toCheck.error };

  const config = getSmtpConfig();

  // Not configured → log the would-be send for dev inspection (recipient +
  // subject only; never the message body, which may contain personal data).
  if (!config) {
    console.log(
      `[SMTP] SKIPPED (SMTP_* not configured). To: ${toCheck.list.join(", ")} · Subject: ${input.subject}`
    );
    return {
      success: false,
      skipped: true,
      error:
        "Email provider not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing).",
    };
  }

  // Fresh transport per send — serverless-safe (no pooled sockets). Timeouts
  // prevent a hung SMTP server from pinning a Vercel function to its limit.
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // 465 = implicit SSL; 587 = STARTTLS
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: toCheck.list.join(", "),
      cc: input.cc
        ? (Array.isArray(input.cc) ? input.cc : [input.cc]).join(", ")
        : undefined,
      bcc: input.bcc
        ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]).join(", ")
        : undefined,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted?.filter(Boolean) as string[] | undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    console.error("[SMTP] Send failed:", message);
    return { success: false, error: message };
  }
}
