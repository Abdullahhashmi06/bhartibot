"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppBaseUrl } from "@/lib/utils";
import { sendEmailWithLog } from "@/lib/email/log";
import {
  sendInterviewAcceptedEmail,
  sendInterviewDeclinedEmail,
  sendRescheduleRequestedEmail,
  sendRescheduleApprovedEmail,
  sendRescheduleRejectedEmail,
  sendInterviewCancelledEmail,
  sendInterviewCompletedEmail,
  type InterviewEmailParams,
} from "@/lib/notifications/email";
import { createNotification } from "@/lib/queries/notifications";

export type ActionResult = { success: boolean; error?: string };

interface InterviewContext {
  interviewId: string;
  applicationId: string;
  internshipId: string;
  applicantName: string;
  applicantEmail: string;
  internshipTitle: string;
  organizationName: string;
  recruiterId: string;
  recruiterEmail: string | null;
  /** The current interview row (fresh after updates). */
  row: {
    status: string;
    interview_date: string | null;
    interview_time: string | null;
    timezone: string | null;
    interview_type: "online" | "on_site" | "phone";
    interviewer_name: string | null;
    meeting_link: string | null;
    venue: string | null;
    notes: string | null;
  };
}

/**
 * Loads the interview + application + internship + organisation + recruiter
 * via the admin client (service role). Callers MUST verify ownership before
 * acting on the result.
 */
async function loadInterviewContext(
  admin: ReturnType<typeof createAdminClient>,
  interviewId: string
): Promise<InterviewContext | null> {
  const { data: interview, error } = await admin
    .from("interviews")
    .select("*")
    .eq("id", interviewId)
    .maybeSingle();

  if (error || !interview) {
    console.error("[INTERVIEW ACTION] interview not found:", interviewId, error?.message);
    return null;
  }

  const { data: application } = await admin
    .from("applications")
    .select("id, applicant_name, email, internship_id")
    .eq("id", interview.application_id)
    .maybeSingle();

  if (!application) return null;

  const { data: internship } = await admin
    .from("internships")
    .select("id, title, organization_id")
    .eq("id", application.internship_id)
    .maybeSingle();

  let organizationName = "Organization";
  if (internship) {
    const { data: org } = await admin
      .from("organisations")
      .select("name")
      .eq("id", internship.organization_id)
      .maybeSingle();
    if (org?.name) organizationName = org.name;
  }

  let recruiterEmail: string | null = null;
  try {
    const { data: recruiterUser } = await admin.auth.admin.getUserById(
      interview.recruiter_id
    );
    recruiterEmail = recruiterUser?.user?.email ?? null;
  } catch {
    recruiterEmail = null;
  }

  return {
    interviewId,
    applicationId: application.id,
    internshipId: application.internship_id,
    applicantName: application.applicant_name,
    applicantEmail: application.email,
    internshipTitle: internship?.title ?? "Internship",
    organizationName,
    recruiterId: interview.recruiter_id,
    recruiterEmail,
    row: {
      status: interview.status ?? "not_scheduled",
      interview_date: interview.interview_date ?? null,
      interview_time: interview.interview_time ?? null,
      timezone: interview.timezone ?? null,
      interview_type: interview.interview_type ?? "online",
      interviewer_name: interview.interviewer_name ?? null,
      meeting_link: interview.meeting_link ?? null,
      venue: interview.venue ?? null,
      notes: interview.notes ?? null,
    },
  };
}

function emailParams(ctx: InterviewContext, to: string): InterviewEmailParams {
  return {
    to,
    applicantName: ctx.applicantName,
    internshipTitle: ctx.internshipTitle,
    organizationName: ctx.organizationName,
    interviewDate: ctx.row.interview_date ?? "TBA",
    interviewTime: ctx.row.interview_time ?? "TBA",
    timezone: ctx.row.timezone || "local time",
    interviewType: ctx.row.interview_type,
    meetingLink: ctx.row.meeting_link,
    venue: ctx.row.venue,
    notes: ctx.row.notes,
    interviewerName: ctx.row.interviewer_name,
    ctaUrl: `${getAppBaseUrl()}/dashboard/applications/${ctx.internshipId}/${ctx.applicationId}`,
  };
}

/**
 * CTA for applicant-facing emails: the applicant's own dashboard. They have no
 * access to the recruiter's /dashboard path, so a link there would bounce them
 * through middleware — point at /applicant directly. Absolute URL required
 * (relative hrefs inside emails resolve against the recipient's mail client).
 */
function applicantEmailParams(
  ctx: InterviewContext,
  to: string
): InterviewEmailParams {
  return {
    ...emailParams(ctx, to),
    ctaUrl: `${getAppBaseUrl()}/applicant`,
  };
}

/** Resolve the applicant's email for the current session (same lookup as the RLS policy). */
async function currentApplicantEmail(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (user.email) return user.email;

  const { data: profile } = await supabase
    .from("applicant_profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.email ?? null;
}

function sameEmail(a: string | null, b: string): boolean {
  if (!a) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Applicant responds to an interview invitation: accept, decline (with an
 * optional reason), or request a reschedule (preferred date/time + message).
 * Ownership is verified server-side (the application must belong to the
 * caller's email). The update, email, and notification all happen here so the
 * applicant never needs write access to the interviews table (RLS untouched).
 */
export async function applicantRespondToInterviewAction(
  interviewId: string,
  action: "accept" | "decline" | "reschedule",
  payload?: { reason?: string; date?: string; time?: string; note?: string }
): Promise<ActionResult> {
  const applicantEmail = await currentApplicantEmail();
  if (!applicantEmail) {
    return { success: false, error: "You must be signed in to respond." };
  }

  const admin = createAdminClient();
  const ctx = await loadInterviewContext(admin, interviewId);
  if (!ctx) return { success: false, error: "Interview not found." };

  if (!sameEmail(applicantEmail, ctx.applicantEmail)) {
    return { success: false, error: "This interview does not belong to your application." };
  }

  // State guard: only respondable while the interview is still live.
  if (ctx.row.status !== "scheduled" && ctx.row.status !== "accepted") {
    return {
      success: false,
      error: "This interview can no longer be responded to.",
    };
  }

  const now = new Date().toISOString();

  if (action === "decline" && payload?.reason && payload.reason.length > 1000) {
    return { success: false, error: "The decline reason is too long." };
  }
  if (action === "reschedule") {
    if (!payload?.date || !payload?.time) {
      return { success: false, error: "Please choose a preferred date and time." };
    }
  }

  let update: Record<string, unknown>;
  if (action === "accept") {
    update = { status: "accepted", updated_at: now };
  } else if (action === "decline") {
    update = {
      status: "declined",
      decline_reason: payload?.reason?.trim() || null,
      updated_at: now,
    };
  } else {
    update = {
      status: "reschedule_requested",
      reschedule_requested_date: payload?.date?.trim() || null,
      reschedule_requested_time: payload?.time?.trim() || null,
      reschedule_request_note: payload?.note?.trim() || null,
      reschedule_status: "pending",
      updated_at: now,
    };
  }

  const { error } = await admin
    .from("interviews")
    .update(update)
    .eq("id", interviewId);

  if (error) {
    console.error("[INTERVIEW ACTION] applicant update failed:", error.message);
    return { success: false, error: "Could not save your response. Please try again." };
  }

  const cta = `/dashboard/applications/${ctx.internshipId}/${ctx.applicationId}`;

  if (action === "accept") {
    await createNotification(admin, ctx.recruiterId, {
      type: "interview_accepted",
      title: "Interview accepted",
      body: `${ctx.applicantName} accepted the interview for ${ctx.internshipTitle}.`,
      link: cta,
    });
    if (ctx.recruiterEmail) {
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_accepted",
        recipientEmail: ctx.recruiterEmail,
        subject: `Interview Accepted — ${ctx.applicantName}`,
        internshipId: ctx.internshipId,
        metadata: { interviewId },
        send: () => sendInterviewAcceptedEmail(emailParams(ctx, ctx.recruiterEmail!)),
      });
    }
  } else if (action === "decline") {
    await createNotification(admin, ctx.recruiterId, {
      type: "interview_declined",
      title: "Interview declined",
      body: `${ctx.applicantName} declined the interview for ${ctx.internshipTitle}.`,
      link: cta,
    });
    if (ctx.recruiterEmail) {
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_declined",
        recipientEmail: ctx.recruiterEmail,
        subject: `Interview Declined — ${ctx.applicantName}`,
        internshipId: ctx.internshipId,
        metadata: { interviewId, reason: payload?.reason ?? null },
        send: () =>
          sendInterviewDeclinedEmail(emailParams(ctx, ctx.recruiterEmail!), payload?.reason),
      });
    }
  } else {
    await createNotification(admin, ctx.recruiterId, {
      type: "interview_reschedule_requested",
      title: "Reschedule requested",
      body: `${ctx.applicantName} requested to reschedule the interview for ${ctx.internshipTitle}.`,
      link: cta,
    });
    if (ctx.recruiterEmail) {
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_reschedule_requested",
        recipientEmail: ctx.recruiterEmail,
        subject: `Reschedule Requested — ${ctx.applicantName}`,
        internshipId: ctx.internshipId,
        metadata: {
          interviewId,
          requestedDate: payload?.date ?? null,
          requestedTime: payload?.time ?? null,
        },
        send: () =>
          sendRescheduleRequestedEmail(emailParams(ctx, ctx.recruiterEmail!), {
            date: payload?.date ?? "",
            time: payload?.time ?? "",
            note: payload?.note,
          }),
      });
    }
  }

  return { success: true };
}

/** Resolve the auth.users id for an application email (applicant notifications). */
async function applicantUserId(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  try {
    const { data } = await admin
      .from("auth.users")
      .select("id")
      .ilike("email", email.trim().toLowerCase())
      .maybeSingle();
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Recruiter manages an interview: approve/reject a reschedule request, cancel,
 * complete, or mark as missed. Ownership verified server-side
 * (interview.recruiter_id must equal the caller). Emails + notifications fire
 * with DISTINCT email types so deduplication never blocks follow-up emails.
 */
export async function recruiterInterviewAction(
  interviewId: string,
  action:
    | "approve_reschedule"
    | "reject_reschedule"
    | "cancel"
    | "complete"
    | "missed"
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();
  let ctx = await loadInterviewContext(admin, interviewId);
  if (!ctx) return { success: false, error: "Interview not found." };

  if (ctx.recruiterId !== user.id) {
    return { success: false, error: "You don't have access to this interview." };
  }

  // State guards: reschedule decisions only while a request is pending;
  // cancel/complete/missed only while the interview is live.
  if (action === "approve_reschedule" || action === "reject_reschedule") {
    if (ctx.row.status !== "reschedule_requested") {
      return { success: false, error: "There is no pending reschedule request." };
    }
  } else if (ctx.row.status !== "scheduled" && ctx.row.status !== "accepted") {
    return {
      success: false,
      error: "This interview is not in a state that can be changed.",
    };
  }

  const now = new Date().toISOString();
  let update: Record<string, unknown>;

  switch (action) {
    case "approve_reschedule": {
      const fresh = await admin
        .from("interviews")
        .select("reschedule_requested_date, reschedule_requested_time")
        .eq("id", interviewId)
        .maybeSingle();
      const newDate = fresh?.data?.reschedule_requested_date;
      const newTime = fresh?.data?.reschedule_requested_time;
      if (!newDate || !newTime) {
        return { success: false, error: "No reschedule request to approve." };
      }
      update = {
        status: "scheduled",
        interview_date: newDate,
        interview_time: newTime,
        reschedule_status: "approved",
        updated_at: now,
      };
      break;
    }
    case "reject_reschedule":
      update = { status: "scheduled", reschedule_status: "rejected", updated_at: now };
      break;
    case "cancel":
      update = { status: "cancelled", updated_at: now };
      break;
    case "complete":
      update = { status: "completed", updated_at: now };
      break;
    case "missed":
      update = { status: "missed", updated_at: now };
      break;
  }

  const { error } = await admin.from("interviews").update(update).eq("id", interviewId);
  if (error) {
    console.error("[INTERVIEW ACTION] recruiter update failed:", error.message);
    return { success: false, error: "Could not update the interview. Please try again." };
  }

  // Reload so emails/notifications carry the current (possibly new) slot.
  ctx = (await loadInterviewContext(admin, interviewId)) ?? ctx;

  const applicantUid = await applicantUserId(admin, ctx.applicantEmail);
  const applicantCta = "/applicant";

  switch (action) {
    case "approve_reschedule":
      await createNotification(admin, applicantUid, {
        type: "interview_reschedule_approved",
        title: "Interview rescheduled",
        body: `Your interview for ${ctx.internshipTitle} has been moved to ${ctx.row.interview_date} at ${ctx.row.interview_time}.`,
        link: applicantCta,
      });
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_reschedule_approved",
        recipientEmail: ctx.applicantEmail,
        subject: `Your Interview Has Been Rescheduled — ${ctx.internshipTitle}`,
        internshipId: ctx.internshipId,
        metadata: { interviewId },
        send: () => sendRescheduleApprovedEmail(applicantEmailParams(ctx, ctx.applicantEmail)),
      });
      break;
    case "reject_reschedule":
      await createNotification(admin, applicantUid, {
        type: "interview_reschedule_rejected",
        title: "Reschedule request declined",
        body: `Your reschedule request for ${ctx.internshipTitle} was not approved. The original slot stands.`,
        link: applicantCta,
      });
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_reschedule_rejected",
        recipientEmail: ctx.applicantEmail,
        subject: `Update on Your Reschedule Request — ${ctx.internshipTitle}`,
        internshipId: ctx.internshipId,
        metadata: { interviewId },
        send: () => sendRescheduleRejectedEmail(applicantEmailParams(ctx, ctx.applicantEmail)),
      });
      break;
    case "cancel":
      await createNotification(admin, applicantUid, {
        type: "interview_cancelled",
        title: "Interview cancelled",
        body: `The interview for ${ctx.internshipTitle} has been cancelled.`,
        link: applicantCta,
      });
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_cancelled",
        recipientEmail: ctx.applicantEmail,
        subject: `Interview Cancelled — ${ctx.internshipTitle}`,
        internshipId: ctx.internshipId,
        metadata: { interviewId },
        send: () => sendInterviewCancelledEmail(applicantEmailParams(ctx, ctx.applicantEmail)),
      });
      break;
    case "complete":
      await createNotification(admin, applicantUid, {
        type: "interview_completed",
        title: "Interview completed",
        body: `Thank you for attending your interview for ${ctx.internshipTitle}. We'll be in touch.`,
        link: applicantCta,
      });
      await sendEmailWithLog(admin, {
        applicationId: ctx.applicationId,
        emailType: "interview_completed",
        recipientEmail: ctx.applicantEmail,
        subject: `Interview Completed — ${ctx.internshipTitle}`,
        internshipId: ctx.internshipId,
        metadata: { interviewId },
        send: () => sendInterviewCompletedEmail(applicantEmailParams(ctx, ctx.applicantEmail)),
      });
      break;
    case "missed":
      await createNotification(admin, applicantUid, {
        type: "interview_missed",
        title: "Interview marked as missed",
        body: `Your interview for ${ctx.internshipTitle} was marked as missed.`,
        link: applicantCta,
      });
      break;
  }

  return { success: true };
}
