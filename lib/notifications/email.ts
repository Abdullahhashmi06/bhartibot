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

/**
 * Send a branded interview invitation (with .ics attachment) to an applicant.
 */
export async function sendInterviewEmail(
  params: InterviewEmailParams
): Promise<EmailSendResult> {
  try {
    const details: InterviewEmailDetails = {
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
    };

    const result = await sendInterviewInvitationEmail(details);

    if (!result.success) {
      logEmailFailure(params.to, "Interview email failed: " + (result.error || "Unknown"));
    }

    return mapResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[EMAIL] Failed to send interview notification:", message);
    logEmailFailure(params.to, "Interview email exception: " + message);
    return { success: false, error: message };
  }
}

/**
 * Send a generic, professional rejection email to an applicant.
 * Reads the same for every rejected applicant — no personalized AI reasons.
 */
export async function sendRejectionEmail(
  params: RejectionEmailParams
): Promise<EmailSendResult> {
  try {
    const result = await sendRejectedEmail({
      to: params.to,
      applicantName: params.applicantName,
      internshipTitle: params.internshipTitle,
      organizationName: params.organizationName,
    });

    if (!result.success) {
      logEmailFailure(params.to, "Rejection email failed: " + (result.error || "Unknown"));
    }

    return mapResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[EMAIL] Failed to send rejection notification:", message);
    logEmailFailure(params.to, "Rejection email exception: " + message);
    return { success: false, error: message };
  }
}
