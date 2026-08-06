/**
 * InternIQ email message templates — barrel export.
 */

export { buildOtpEmailHtml, sendOtpEmail } from "./otp";
export {
  buildResetPasswordEmailHtml,
  sendResetPasswordEmail,
} from "./reset-password";
export {
  buildShortlistedEmailHtml,
  sendShortlistedEmail,
  buildRejectedEmailHtml,
  sendRejectedEmail,
} from "./status";
export {
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
} from "./interview";

export type { InterviewEmailDetails } from "./interview";
