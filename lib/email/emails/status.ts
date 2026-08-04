import {
  baseLayout,
  button,
  companyCard,
  divider,
  escapeHtml,
  statusBadge,
} from "@/lib/email/templates";
import { sendEmail, type SendEmailResult } from "@/lib/email/smtp";

/* ── SHORTLISTED ─────────────────────────────────────────────────────── */

export function buildShortlistedEmailHtml(opts: {
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  /** URL to the applicant dashboard. */
  dashboardUrl?: string;
}): string {
  const content = `
    <tr>
      <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
          Congratulations${opts.applicantName ? `, ${escapeHtml(opts.applicantName)}` : ""}! 🎉
        </h1>
        ${statusBadge("You've been shortlisted", "success")}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
          Great news — your application has been shortlisted for further
          consideration. Our team was impressed by your profile and we'd love to
          keep you in the running.
        </p>
        ${companyCard({
          companyName: opts.organizationName,
          internshipTitle: opts.internshipTitle,
        })}
        <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
          <strong style="color:#0b1f3a;">What happens next?</strong>
        </p>
        <p style="margin:0 0 6px;font-size:14px;color:#475569;line-height:1.6;">
          1. Keep an eye on your inbox — an interview invitation may be coming.
        </p>
        <p style="margin:0 0 6px;font-size:14px;color:#475569;line-height:1.6;">
          2. Track your application status in your dashboard.
        </p>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
          3. Make sure your contact details and availability are up to date.
        </p>
        ${opts.dashboardUrl ? button(opts.dashboardUrl, "View Dashboard") : ""}
      </td>
    </tr>
    ${divider()}
    <tr>
      <td>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
          If you didn't apply for this position, you can safely ignore this email.
        </p>
      </td>
    </tr>`;

  return baseLayout({ title: `You've been shortlisted — ${opts.internshipTitle}`, content });
}

export async function sendShortlistedEmail(opts: {
  to: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  dashboardUrl?: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: `Congratulations! You've been shortlisted 🎉`,
    html: buildShortlistedEmailHtml(opts),
    text: `Congratulations${opts.applicantName ? `, ${opts.applicantName}` : ""}! You've been shortlisted for ${opts.internshipTitle} at ${opts.organizationName}. Track your application status in your InternIQ dashboard.`,
  });
}

/* ── REJECTED ────────────────────────────────────────────────────────── */

export function buildRejectedEmailHtml(opts: {
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  /** URL to the applicant internship explorer. */
  exploreUrl?: string;
}): string {
  const content = `
    <tr>
      <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
          Update regarding your application
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
          Dear ${escapeHtml(opts.applicantName)},<br/><br/>
          Thank you for applying to <strong style="color:#0b1f3a;">${escapeHtml(opts.internshipTitle)}</strong>
          at <strong style="color:#0b1f3a;">${escapeHtml(opts.organizationName)}</strong>. We truly
          appreciate the time and effort you invested in your application.
        </p>
        <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
          After careful consideration, we regret to inform you that we will not
          be moving forward with your application at this time. Please know that
          this decision does not reflect on your potential — we received many
          strong applications and the decision was extremely difficult.
        </p>
        <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
          We encourage you to apply again for future opportunities that match
          your skills and interests. We'd love to see your application again.
        </p>
        ${opts.exploreUrl ? button(opts.exploreUrl, "Explore More Internships") : ""}
      </td>
    </tr>
    ${divider()}
    <tr>
      <td>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
          Best regards,<br/>
          <strong style="color:#0b1f3a;">${escapeHtml(opts.organizationName)} Recruitment Team</strong>
        </p>
      </td>
    </tr>`;

  return baseLayout({ title: `Update on your application — ${opts.internshipTitle}`, content });
}

export async function sendRejectedEmail(opts: {
  to: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  exploreUrl?: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "Update regarding your internship application",
    html: buildRejectedEmailHtml(opts),
    text: `Dear ${opts.applicantName}, thank you for applying to ${opts.internshipTitle} at ${opts.organizationName}. After careful consideration we will not be moving forward with your application at this time. We encourage you to apply again in the future.`,
  });
}
