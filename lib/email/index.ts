/**
 * InternIQ email service — centralized entry point.
 *
 * Re-export the SMTP transport and every branded message template so feature
 * code imports from `@/lib/email` instead of reaching into internals.
 */

export {
  getSmtpConfig,
  isSmtpConfigured,
  sendEmail,
} from "./smtp";

export type {
  EmailAttachment,
  SendEmailInput,
  SendEmailResult,
  SmtpConfig,
} from "./smtp";

export {
  buildOtpEmailHtml,
  sendOtpEmail,
  buildResetPasswordEmailHtml,
  sendResetPasswordEmail,
  buildShortlistedEmailHtml,
  sendShortlistedEmail,
  buildRejectedEmailHtml,
  sendRejectedEmail,
  buildIcsAttachment,
  buildInterviewInvitationEmailHtml,
  sendInterviewInvitationEmail,
  buildInterviewReminderEmailHtml,
  sendInterviewReminderEmail,
  buildInterviewAcceptedEmailHtml,
  sendInterviewAcceptedEmail,
  buildInterviewDeclinedEmailHtml,
  sendInterviewDeclinedEmail,
  buildRescheduleRequestedEmailHtml,
  sendRescheduleRequestedEmail,
  buildRescheduleApprovedEmailHtml,
  sendRescheduleApprovedEmail,
  buildRescheduleRejectedEmailHtml,
  sendRescheduleRejectedEmail,
  buildInterviewCancelledEmailHtml,
  sendInterviewCancelledEmail,
  buildInterviewCompletedEmailHtml,
  sendInterviewCompletedEmail,
} from "./emails";

export type { InterviewEmailDetails } from "./emails";

export {
  baseLayout,
  button,
  companyCard,
  divider,
  emailFooter,
  emailHeader,
  escapeHtml,
  otpBox,
  securityNote,
  statusBadge,
} from "./templates";

/** Builds a branded "SMTP test" HTML email (kept for /api/email/test + CLI). */
export { buildTestEmailHtml } from "./test-html";
