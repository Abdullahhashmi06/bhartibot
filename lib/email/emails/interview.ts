import {
  baseLayout,
  button,
  companyCard,
  divider,
  escapeHtml,
} from "@/lib/email/templates";
import { sendEmail, type SendEmailResult } from "@/lib/email/smtp";

export interface InterviewEmailDetails {
  to: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  interviewType: "online" | "on_site" | "phone";
  meetingLink?: string | null;
  venue?: string | null;
  notes?: string | null;
  interviewerName?: string | null;
}

/**
 * UTC offset (in minutes, ahead-of-UTC positive) of `timeZone` at `date`.
 * Derived from Intl so it is correct for DST and any IANA zone.
 */
function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const label = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const match = label.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const mins = Number.parseInt(match[3], 10);
  return sign * (hours * 60 + mins);
}

/** RFC 3339-style UTC timestamp for .ics (e.g. 20260807T183000Z). */
function toIcsDate(date: string, time: string, timezone: string): string {
  // date = YYYY-MM-DD, time = HH:mm (12-hour "hh:mm AM" possible from input).
  let hours = 0;
  let minutes = 0;
  const t = time.trim();
  const ampm = t.match(/\b(am|pm)\b/i)?.[1]?.toLowerCase();
  const cleaned = t.replace(/\b(am|pm)\b/gi, "").trim();
  const parts = cleaned.split(":").map((p) => parseInt(p, 10));
  if (parts.length >= 1 && Number.isFinite(parts[0])) hours = parts[0];
  if (parts.length >= 2 && Number.isFinite(parts[1])) minutes = parts[1];
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  // Wall clock in the target zone, then subtract the zone offset to get the
  // true UTC instant. Independent of the server's own timezone.
  const iso = `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  try {
    const wallClockAsUtc = new Date(`${iso}Z`);
    const utcMs = wallClockAsUtc.getTime() - getTimezoneOffsetMinutes(timezone, wallClockAsUtc) * 60_000;
    return new Date(utcMs).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  } catch {
    return iso.replace(/[-:]/g, "") + "Z";
  }
}

/** Builds an .ics calendar attachment for the interview. */
export function buildIcsAttachment(details: InterviewEmailDetails): {
  filename: string;
  content: string;
  contentType: string;
} {
  const dtstart = toIcsDate(details.interviewDate, details.interviewTime, details.timezone);
  const location =
    details.interviewType === "online"
      ? details.meetingLink || "Online interview"
      : details.venue || "To be announced";

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InternIQ//Interview//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:interniq-interview-${Date.now()}@interniq.app`,
    `DTSTAMP:${dtstart}`,
    `DTSTART:${dtstart}`,
    "SUMMARY:Interview Invitation - " + escapeIcs(details.internshipTitle),
    "DESCRIPTION:" + escapeIcs(
      `Interview for ${details.internshipTitle} at ${details.organizationName}.` +
      (details.notes ? ` Notes: ${details.notes}` : "")
    ),
    "LOCATION:" + escapeIcs(location),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    filename: "interview-invitation.ics",
    content,
    contentType: "text/calendar; charset=utf-8",
  };
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/\n/g, "\\n");
}

/* ── INTERVIEW INVITATION ────────────────────────────────────────────── */

export function buildInterviewInvitationEmailHtml(details: InterviewEmailDetails): string {
  const typeLabel =
    details.interviewType === "online"
      ? "Online"
      : details.interviewType === "on_site"
        ? "On-site"
        : "Phone";

  const locationInfo =
    details.interviewType === "online" && details.meetingLink
      ? `<p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.6;"><strong style="color:#0b1f3a;">Location:</strong> Online — meeting link below</p>`
      : details.interviewType === "on_site" && details.venue
        ? `<p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.6;"><strong style="color:#0b1f3a;">Location:</strong> ${escapeHtml(details.venue)}</p>`
        : `<p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.6;"><strong style="color:#0b1f3a;">Location:</strong> ${typeLabel} — details will be shared closer to the date</p>`;

  const content = `
    <tr>
      <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
          Interview Invitation 🎤
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:#475569;">
          ${escapeHtml(details.internshipTitle)} · ${escapeHtml(details.organizationName)}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
          Dear ${escapeHtml(details.applicantName)},<br/><br/>
          We're pleased to invite you to an interview for
          <strong style="color:#0b1f3a;">${escapeHtml(details.internshipTitle)}</strong> at
          <strong style="color:#0b1f3a;">${escapeHtml(details.organizationName)}</strong>.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:20px 0;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px;">Date</p>
            <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#0b1f3a;">${escapeHtml(details.interviewDate)}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px;">Time</p>
            <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#0b1f3a;">${escapeHtml(details.interviewTime)} (${escapeHtml(details.timezone)})</p>
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px;">Type</p>
            <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#0b1f3a;">${typeLabel}</p>
            ${locationInfo}
            ${details.interviewerName ? `<p style="margin:12px 0 0;font-size:14px;color:#475569;"><strong style="color:#0b1f3a;">Interviewer:</strong> ${escapeHtml(details.interviewerName)}</p>` : ""}
          </td></tr>
        </table>
        ${
          details.interviewType === "online" && details.meetingLink
            ? button(details.meetingLink, "Join Interview")
            : ""
        }
        ${
          details.notes
            ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;line-height:1.6;"><strong style="color:#0b1f3a;">Notes:</strong> ${escapeHtml(details.notes)}</p>`
            : ""
        }
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
          📅 A calendar invite (.ics) is attached to this email.
        </p>
      </td>
    </tr>
    ${divider()}
    <tr>
      <td>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
          If you're unable to attend, please reply to this email or contact us
          so we can reschedule.
        </p>
      </td>
    </tr>`;

  return baseLayout({ title: `Interview Invitation — ${details.internshipTitle}`, content });
}

/** Sends a branded interview invitation with an .ics attachment. */
export async function sendInterviewInvitationEmail(
  details: InterviewEmailDetails
): Promise<SendEmailResult> {
  return sendEmail({
    to: details.to,
    subject: `Interview Invitation — ${details.internshipTitle}`,
    html: buildInterviewInvitationEmailHtml(details),
    text: `Dear ${details.applicantName}, you're invited to an interview for ${details.internshipTitle} at ${details.organizationName} on ${details.interviewDate} at ${details.interviewTime} (${details.timezone}). A calendar invite is attached.`,
    attachments: [buildIcsAttachment(details)],
  });
}

/* ── INTERVIEW REMINDER (template + helper only — no scheduling) ─────── */

export function buildInterviewReminderEmailHtml(details: InterviewEmailDetails): string {
  const typeLabel =
    details.interviewType === "online"
      ? "Online"
      : details.interviewType === "on_site"
        ? "On-site"
        : "Phone";

  const content = `
    <tr>
      <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">
          Interview Reminder ⏰
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
          Hi ${escapeHtml(details.applicantName)},<br/>
          This is a friendly reminder that your interview for
          <strong style="color:#0b1f3a;">${escapeHtml(details.internshipTitle)}</strong> at
          <strong style="color:#0b1f3a;">${escapeHtml(details.organizationName)}</strong> is coming up.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:20px 0;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px;">Date &amp; Time</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#0b1f3a;">${escapeHtml(details.interviewDate)} at ${escapeHtml(details.interviewTime)} (${escapeHtml(details.timezone)})</p>
            <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px;">Type</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#0b1f3a;">${typeLabel}</p>
          </td></tr>
        </table>
        ${
          details.interviewType === "online" && details.meetingLink
            ? button(details.meetingLink, "Join Interview")
            : ""
        }
        <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
          Please let us know if you need to reschedule.
        </p>
      </td>
    </tr>`;

  return baseLayout({ title: `Reminder: interview for ${details.internshipTitle}`, content });
}

/** Sends a branded interview reminder. Scheduling logic is intentionally out of scope. */
export async function sendInterviewReminderEmail(
  details: InterviewEmailDetails
): Promise<SendEmailResult> {
  return sendEmail({
    to: details.to,
    subject: `Reminder: Interview for ${details.internshipTitle}`,
    html: buildInterviewReminderEmailHtml(details),
    text: `Hi ${details.applicantName}, this is a reminder about your interview for ${details.internshipTitle} on ${details.interviewDate} at ${details.interviewTime} (${details.timezone}).`,
  });
}
