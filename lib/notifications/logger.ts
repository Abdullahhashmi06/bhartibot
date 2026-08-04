/**
 * Email failure logger for InternIQ.
 *
 * Deduplication now lives in the database (email_logs table — see
 * lib/email/log.ts). This module only keeps the in-memory failure log used
 * by the email delegation layer.
 *
 * Note: the failure log is an in-memory store and is lost on server restart.
 */

export interface EmailFailureLog {
  recipient: string;
  context: string;
  timestamp: string;
}

const MAX_LOG_ENTRIES = 200;
const failureLog: EmailFailureLog[] = [];

/** Record an email failure with recipient and context message. */
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
