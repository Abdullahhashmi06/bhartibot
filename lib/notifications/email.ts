/**
 * Email notification service for InternIQ.
 *
 * Thin delegation layer over the centralized SMTP email system in
 * `lib/email` — keeps the original exported API so existing callers keep
 * working while all delivery flows through the single sendEmail() service.
 * Resend-specific code and duplicate templates were removed; the branded
 * templates live in lib/email/emails.
 */

import { logEmailFailure } from "./logger";
import {
  sendInterviewInvitationEmail,
  sendRejectedEmail,
  sendInterviewAcceptedEmail as tplInterviewAccepted,
  sendInterviewDeclinedEmail as tplInterviewDeclined,
  sendRescheduleRequestedEmail as tplRescheduleRequested,
  sendRescheduleApprovedEmail as tplRescheduleApproved,
  sendRescheduleRejectedEmail as tplRescheduleRejected,
  sendInterviewCancelledEmail as tplInterviewCancelled,
  sendInterviewCompletedEmail as tplInterviewCompleted,
  type InterviewEmailDetails,
} from "@/lib/email/emails";

export interface InterviewEmailParams {
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
  /** True when this invitation replaces an earlier slot (updated schedule). */
  reschedule?: boolean;
  /** Primary CTA destination (recruiter application page / applicant dashboard). */
  ctaUrl?: string | null;
}

export interface EmailSendResult {
  success: boolean;
  error?: string;
  /** True when no provider key is configured, so the email was logged, not sent. */
  skipped?: boolean;
  /** SMTP message id — preserved so the DB email_log can record it. */
  messageId?: string;
}

export interface RejectionEmailParams {
  to: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
}

function mapResult(r: {
  success: boolean;
  error?: string;
  skipped?: boolean;
  messageId?: string;
}): EmailSendResult {
  return {
    success: r.success,
    error: r.error,
    skipped: r.skipped,
    messageId: r.messageId,
  };
}

function buildDetails(params: InterviewEmailParams): InterviewEmailDetails {
  return {
    to: params.to,
    applicantName: params.applicantName,
    internshipTitle: params.internshipTitle,
    organizationName: params.organizationName,
    interviewDate: params.interviewDate,
    interviewTime: params.interviewTime,
    timezone: params.timezone,
    interviewType: params.interviewType,
    meetingLink: params.meetingLink,
    venue: params.venue,
    notes: params.notes,
    interviewerName: params.interviewerName,
    ctaUrl: params.ctaUrl ?? null,
  };
}

async function sendWithLog(
  to: string,
  label: string,
  send: () => Promise<{
    success: boolean;
    error?: string;
    skipped?: boolean;
    messageId?: string;
  }>
): Promise<EmailSendResult> {
  try {
    const result = await send();
    if (!result.success) {
      logEmailFailure(to, `${label} failed: ${result.error || "Unknown"}`);
    }
    return mapResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[EMAIL] ${label} exception:`, message);
    logEmailFailure(to, `${label} exception: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Send a branded interview invitation (with .ics attachment) to an applicant.
 */
export async function sendInterviewEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Interview email", () =>
    sendInterviewInvitationEmail(buildDetails(params), {
      reschedule: params.reschedule === true,
    })
  );
}

/** Applicant accepted the interview — sent to the recruiter. */
export async function sendInterviewAcceptedEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Accepted email", () =>
    tplInterviewAccepted(buildDetails(params))
  );
}

/** Applicant declined the interview — sent to the recruiter (with reason). */
export async function sendInterviewDeclinedEmail(
  params: InterviewEmailParams,
  reason?: string | null
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Declined email", () =>
    tplInterviewDeclined(buildDetails(params), reason)
  );
}

/** Applicant requested a reschedule — sent to the recruiter. */
export async function sendRescheduleRequestedEmail(
  params: InterviewEmailParams,
  requested: { date: string; time: string; note?: string | null }
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Reschedule-request email", () =>
    tplRescheduleRequested(buildDetails(params), requested)
  );
}

/** Reschedule approved — sent to the applicant (new slot). */
export async function sendRescheduleApprovedEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Reschedule-approved email", () =>
    tplRescheduleApproved(buildDetails(params))
  );
}

/** Reschedule rejected — sent to the applicant (original slot retained). */
export async function sendRescheduleRejectedEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Reschedule-rejected email", () =>
    tplRescheduleRejected(buildDetails(params))
  );
}

/** Interview cancelled — sent to the applicant. */
export async function sendInterviewCancelledEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Cancelled email", () =>
    tplInterviewCancelled(buildDetails(params))
  );
}

/** Interview completed — sent to the applicant. */
export async function sendInterviewCompletedEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Completed email", () =>
    tplInterviewCompleted(buildDetails(params))
  );
}

/**
 * Send a generic, professional rejection email to an applicant.
 * Reads the same for every rejected applicant — no personalized AI reasons.
 */
export async function sendRejectionEmail(
  params: RejectionEmailParams
): Promise<EmailSendResult> {
  return sendWithLog(params.to, "Rejection email", () =>
    sendRejectedEmail({
      to: params.to,
      applicantName: params.applicantName,
      internshipTitle: params.internshipTitle,
      organizationName: params.organizationName,
    })
  );
}
