#!/usr/bin/env node
/**
 * Test the InternIQ SMTP configuration from the command line.
 *
 * Usage (from project root):
 *   node --env-file=.env.local scripts/test-smtp.mjs you@example.com
 *
 * Reads credentials exclusively from the environment:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Sends a single branded test email through the configured SMTP provider and
 * prints the outcome. Exits non-zero on failure so it can be used in CI.
 */

import nodemailer from "nodemailer";

const to = process.argv[2];

if (!to) {
  console.error("Usage: node --env-file=.env.local scripts/test-smtp.mjs <recipient@example.com>");
  process.exit(1);
}

const host = process.env.SMTP_HOST?.trim();
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();

if (!host || !user || !pass) {
  console.error(
    "SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS " +
      "(optionally SMTP_PORT, SMTP_FROM) in .env.local and retry."
  );
  process.exit(1);
}

const portRaw = Number.parseInt(process.env.SMTP_PORT || "", 10);
const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 587;
const from =
  process.env.SMTP_FROM?.trim() ||
  (user.includes("@") ? `InternIQ <${user}>` : "InternIQ <no-reply@interniq.app>");

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

const subject = "InternIQ — SMTP Configuration Test";
const text =
  "This is a test email from InternIQ. If you can read this, your SMTP configuration is working correctly.";
const html = `
<div style="background:#f1f5f9;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%"><tr><td align="center">
    <table role="presentation" width="480" style="max-width:480px;width:100%;">
      <tr><td style="text-align:center;padding-bottom:24px;">
        <span style="background:linear-gradient(135deg,#17C6B5,#6F52ED);border-radius:10px;padding:8px 16px;color:#fff;font-weight:800;font-size:18px;">InternIQ</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:20px;padding:40px 32px;">
        <h1 style="margin:0 0 12px;font-size:22px;color:#0b1f3a;">✅ SMTP Configuration Test</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
          This email was sent from the InternIQ CLI test utility to verify your
          MailerSend / SMTP setup.
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
          If you are reading this, your SMTP configuration is working correctly. 🎉
        </p>
        <p style="margin:0;font-size:12px;color:#94a3b8;">
          Sent at ${new Date().toISOString()} via Nodemailer over SMTP.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</div>`;

console.log(`Sending test email to ${to} via ${host}:${port} ...`);

try {
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  console.log("✅ Email sent successfully!");
  console.log("   Message ID:", info.messageId || "n/a");
  console.log("   Accepted:", (info.accepted || []).join(", ") || "n/a");
  process.exit(0);
} catch (err) {
  console.error("❌ Failed to send email:");
  console.error("   ", err instanceof Error ? err.message : err);
  process.exit(1);
}
