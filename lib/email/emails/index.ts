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
} from "./interview";

export type { InterviewEmailDetails } from "./interview";
