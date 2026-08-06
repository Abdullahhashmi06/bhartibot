"use server";

import { sendEmail, baseLayout, escapeHtml } from "@/lib/email";

export interface ContactFormState {
  success: boolean;
  message: string;
}

/** Contact inbox — matches the public footer / legal pages. */
const CONTACT_INBOX = process.env.CONTACT_EMAIL || "interniq26@gmail.com";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Handles contact form submissions. Validates input, builds a branded HTML
 * email through the single email template system, and sends it to the
 * InternIQ contact inbox. Returns a serializable result for the client form —
 * never throws.
 */
export async function submitContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactFormState> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (!name || !email || !subject || !message) {
    return {
      success: false,
      message: "All fields are required. Please fill out the form completely.",
    };
  }

  if (name.length > 120 || subject.length > 200 || message.length > 5000) {
    return {
      success: false,
      message: "One or more fields exceed the maximum allowed length.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "Please enter a valid email address (e.g. name@example.com).",
    };
  }

  const html = baseLayout({
    title: `New contact message — ${subject}`,
    content: `
      <tr><td style="padding:0 0 16px;">
        <p style="margin:0;font-size:14px;color:#475569;">A new message was submitted through the InternIQ contact page.</p>
      </td></tr>
      <tr><td style="padding:0 0 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
          <tr><td style="padding:16px 20px;font-size:13px;color:#0b1f3a;line-height:1.7;">
            <p style="margin:0 0 10px;"><strong style="color:#475569;">From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
            <p style="margin:0 0 10px;"><strong style="color:#475569;">Subject:</strong> ${escapeHtml(subject)}</p>
            <p style="margin:0 0 10px;"><strong style="color:#475569;">Message:</strong></p>
            <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
          </td></tr>
        </table>
      </td></tr>
    `,
  });

  const result = await sendEmail({
    to: CONTACT_INBOX,
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html,
    text: `New contact message\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
  });

  if (result.skipped) {
    // SMTP not configured — message was logged for dev inspection.
    console.warn(
      `[Contact] SMTP not configured; message from ${email} logged (not emailed).`
    );
    return {
      success: true,
      message:
        "Thanks for reaching out! We've received your message and will get back to you soon.",
    };
  }

  if (!result.success) {
    console.error("[Contact] Email send failed:", result.error);
    return {
      success: false,
      message:
        "We couldn't send your message right now. Please try again in a moment.",
    };
  }

  return {
    success: true,
    message:
      "Thanks for reaching out! We've received your message and will get back to you soon.",
  };
}
