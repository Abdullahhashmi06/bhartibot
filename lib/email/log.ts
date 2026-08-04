import "server-only";

/**
 * Database-backed email logging + deduplication for InternIQ.
 *
 * Every transactional email is recorded in the `email_logs` table so that
 * duplicate sends are prevented across serverless instances, restarts, and
 * retries (replacing the previous in-memory logger dedup).
 *
 * Dedup rule: skip sending when a row already exists with the same
 * (application_id, email_type) AND status = 'sent'. The database enforces this
 * with a partial unique index as a hard backstop.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailLogStatus = "sent" | "failed" | "skipped";

export interface EmailLogInput {
  applicationId?: string | null;
  applicantId?: string | null;
  recruiterId?: string | null;
  internshipId?: string | null;
  emailType: string;
  recipientEmail: string;
  subject?: string | null;
  status: EmailLogStatus;
  provider?: string;
  providerMessageId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Returns true when an email of `emailType` was already successfully sent for
 * this application. Only "sent" rows count — failed/skipped attempts do not
 * block a retry.
 */
export async function emailAlreadySent(
  supabase: SupabaseClient,
  applicationId: string,
  emailType: string
): Promise<boolean> {
  if (!applicationId) return false;
  const { data, error } = await supabase
    .from("email_logs")
    .select("id")
    .eq("application_id", applicationId)
    .eq("email_type", emailType)
    .eq("status", "sent")
    .maybeSingle();

  if (error) {
    console.error("[EMAIL LOG] dedup check failed:", error.message);
    return false;
  }
  return !!data;
}

/**
 * Insert an email log row. Never throws — a logging failure must never break
 * the caller's flow. A unique-violation (concurrent duplicate) is expected and
 * swallowed.
 */
export async function insertEmailLog(
  supabase: SupabaseClient,
  input: EmailLogInput
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("email_logs").insert({
    application_id: input.applicationId ?? null,
    applicant_id: input.applicantId ?? null,
    recruiter_id: input.recruiterId ?? undefined, // omit → DB default auth.uid()
    internship_id: input.internshipId ?? null,
    email_type: input.emailType,
    recipient_email: input.recipientEmail,
    subject: input.subject ?? null,
    status: input.status,
    provider: input.provider ?? "smtp",
    provider_message_id: input.providerMessageId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    // 23505 = unique_violation (the hard-backstop index) — expected on races.
    if (error.code === "23505") {
      console.warn(
        `[EMAIL LOG] duplicate sent row blocked by DB for ${input.emailType} (application ${input.applicationId ?? "n/a"})`
      );
    } else {
      console.error("[EMAIL LOG] insert failed:", error.message);
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Orchestrates the full "check → send → log" flow for one email.
 *
 * 1. Dedup: if a "sent" log already exists for (applicationId, emailType),
 *    skips the send and returns { success: true, skipped: true }.
 * 2. Sends via the provided `send` callback (which reuses the SMTP service).
 * 3. Records the outcome in email_logs — including failures, so a transient
 *    SMTP error never rolls back application status and leaves a trace.
 *
 * Never throws; logging failures are swallowed.
 */
export async function sendEmailWithLog(
  supabase: SupabaseClient,
  opts: {
    applicationId: string | null;
    emailType: string;
    recipientEmail: string;
    subject: string;
    internshipId?: string | null;
    applicantId?: string | null;
    metadata?: Record<string, unknown>;
    send: () => Promise<{
      success: boolean;
      skipped?: boolean;
      error?: string;
      messageId?: string;
    }>;
  }
): Promise<{
  success: boolean;
  skipped?: boolean;
  error?: string;
  messageId?: string;
}> {
  // 1. Dedup
  if (opts.applicationId) {
    const already = await emailAlreadySent(supabase, opts.applicationId, opts.emailType);
    if (already) {
      console.log(
        `[EMAIL] skipped duplicate ${opts.emailType} for application ${opts.applicationId}`
      );
      return { success: true, skipped: true };
    }
  }

  // 2. Send (reuses the existing SMTP sendEmail() service)
  const result = await opts.send();

  // 3. Log the outcome — never affects the send result or DB writes elsewhere.
  const status: EmailLogStatus = result.success
    ? "sent"
    : result.skipped
      ? "skipped"
      : "failed";

  await insertEmailLog(supabase, {
    applicationId: opts.applicationId,
    applicantId: opts.applicantId,
    internshipId: opts.internshipId,
    emailType: opts.emailType,
    recipientEmail: opts.recipientEmail,
    subject: opts.subject,
    status,
    providerMessageId: result.messageId ?? null,
    metadata: {
      ...opts.metadata,
      error: result.error ?? null,
    },
  });

  return result;
}
