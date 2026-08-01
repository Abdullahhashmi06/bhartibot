/**
 * Email failure logger for InternIQ.
 * Logs email failures with recipient, context, error, and timestamp.
 * Used by the email notification service to track failures gracefully.
 *
 * Note: This is an in-memory store. Dedup entries are lost on server restart,
 * which may cause a duplicate rejection email to be sent in rare cases.
 * For production use, consider using a database-backed approach.
 */

export interface EmailFailureLog {
  recipient: string;
  context: string;
  timestamp: string;
}

const MAX_LOG_ENTRIES = 100;
const failureLog: EmailFailureLog[] = [];

/**
 * Log an email failure with recipient and context message.
 * The log is bounded to MAX_LOG_ENTRIES to prevent memory growth.
 */
export function logEmailFailure(
  recipient: string,
  context: string
): void {
  failureLog.push({ recipient, context, timestamp: new Date().toISOString() });

  if (failureLog.length > MAX_LOG_ENTRIES) {
    failureLog.shift();
  }

  console.error("[EMAIL FAILURE] " + context + " (recipient: " + recipient + ")");
}

/**
 * Check if a rejection email was already sent to this recipient for this application.
 * Used to prevent duplicate emails when status is re-set to "rejected".
 */
export function hasRejectionEmailBeenSent(
  recipient: string,
  applicationId: string
): boolean {
  const key = "rejection:" + recipient + ":" + applicationId;
  return failureLog.some((entry) => entry.context === key);
}

/**
 * Mark a rejection email as sent for deduplication.
 */
export function markRejectionEmailSent(
  recipient: string,
  applicationId: string
): void {
  logEmailFailure(
    recipient,
    "rejection:" + recipient + ":" + applicationId
  );
}
