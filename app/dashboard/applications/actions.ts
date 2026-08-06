"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInterviewEmail, sendRejectionEmail } from "@/lib/notifications/email";
import { sendShortlistedEmail } from "@/lib/email";
import { sendEmailWithLog } from "@/lib/email/log";

type InterviewEmailParams = {
  applicationId: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  interviewType: "online" | "on_site" | "phone";
  meetingLink?: string | null;
  venue?: string | null;
  notes?: string | null;
  interviewerName?: string | null;
};

type RejectionEmailParams = {
  applicationId: string;
};

/**
 * Resolves applicant details for email sending.
 * If critical pre-fetched fields (to, applicantName, internshipTitle) are provided,
 * uses them directly without DB queries (makes email resilient to DB outages).
 * Otherwise falls back to DB queries.
 */
async function resolveInterviewDetails(params: InterviewEmailParams & {
  applicantName?: string;
  applicantEmail?: string;
  internshipTitle?: string;
  organizationName?: string;
}) {
  // If the 3 critical fields are provided, use them directly (skip DB entirely)
  if (params.applicantEmail && params.applicantName && params.internshipTitle) {
    return {
      to: params.applicantEmail,
      applicantName: params.applicantName,
      internshipTitle: params.internshipTitle,
      organizationName: params.organizationName || "Organization",
      internshipId: null,
    };
  }

  try {
    const supabase = createClient();

    const { data: application } = await supabase
      .from("applications")
      .select("applicant_name, email, internship_id")
      .eq("id", params.applicationId)
      .single();

    if (!application) {
      console.error("[EMAIL] Application not found:", params.applicationId);
      return null;
    }

    const { data: internship } = await supabase
      .from("internships")
      .select("title, organization_id")
      .eq("id", application.internship_id)
      .single();

    if (!internship) {
      console.error("[EMAIL] Internship not found:", application.internship_id);
      return null;
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", internship.organization_id)
      .single();

    return {
      to: application.email,
      applicantName: application.applicant_name,
      internshipTitle: internship.title,
      organizationName: org?.name ?? "Organization",
      internshipId: (application.internship_id as string) || null,
    };
  } catch (dbErr) {
    const msg = dbErr instanceof Error ? dbErr.message : "DB error";
    console.error("[EMAIL] DB resolve failed error=" + msg);
    return null;
  }
}

/**
 * Fetches application + internship details and sends an interview email.
 * Accepts optional pre-fetched applicant details to avoid DB queries.
 * Fire-and-forget: logs failures but never throws.
 */
export async function sendInterviewEmailAction(params: InterviewEmailParams & {
  applicantName?: string;
  applicantEmail?: string;
  internshipTitle?: string;
  organizationName?: string;
}) {
  try {
    const details = await resolveInterviewDetails(params);
    if (!details) {
      return { success: false, error: "Could not resolve applicant details" };
    }

    const supabase = createClient();
    const result = await sendEmailWithLog(supabase, {
      applicationId: params.applicationId,
      emailType: "interview_invitation",
      recipientEmail: details.to,
      subject: `Interview Invitation — ${details.internshipTitle}`,
      internshipId: details.internshipId ?? null,
      metadata: {
        interviewDate: params.interviewDate,
        interviewTime: params.interviewTime,
        timezone: params.timezone,
        interviewType: params.interviewType,
      },
      send: () =>
        sendInterviewEmail({
          to: details.to,
          applicantName: details.applicantName,
          internshipTitle: details.internshipTitle,
          organizationName: details.organizationName,
          interviewDate: params.interviewDate,
          interviewTime: params.interviewTime,
          timezone: params.timezone,
          interviewType: params.interviewType,
          meetingLink: params.meetingLink,
          venue: params.venue,
          notes: params.notes,
          interviewerName: params.interviewerName,
        }),
    });

    if (!result.success && !result.skipped) {
      console.error("[EMAIL] Failed to send:", result.error);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EMAIL] sendInterviewEmailAction error:", message);
    return { success: false, error: message };
  }
}

/**
 * Fetches application + internship details and sends a generic rejection email.
 * Accepts optional pre-fetched applicant details to avoid DB queries.
 * Uses DB-backed dedup (email_logs) to prevent duplicate sends.
 * Fire-and-forget: logs failures but never throws.
 */
export async function sendRejectionEmailAction(
  applicationId: string,
  preFetched?: {
    applicantName?: string;
    applicantEmail?: string;
    internshipTitle?: string;
    organizationName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    let to = preFetched?.applicantEmail || "";
    let applicantName = preFetched?.applicantName || "";
    let internshipTitle = preFetched?.internshipTitle || "";
    let organizationName = preFetched?.organizationName || "";

    // If the 3 critical fields are provided, use them directly without DB.
    // When the org name is still unknown we ALSO resolve from DB so the email
    // never reads "at Organization" (a missing template variable).
    if (!to || !applicantName || !internshipTitle || !organizationName) {
      try {
        const supabase = createClient();

        const { data: application } = await supabase
          .from("applications")
          .select("applicant_name, email, internship_id")
          .eq("id", applicationId)
          .single();

        if (!application || !application.email) {
          console.error("[EMAIL] Application not found for rejection email:", applicationId);
          return { success: false, error: "Applicant not found" };
        }

        to = application.email;
        applicantName = application.applicant_name;

        const { data: internship } = await supabase
          .from("internships")
          .select("title, organization_id")
          .eq("id", application.internship_id)
          .single();

        if (!internship) {
          console.error("[EMAIL] Internship not found:", application.internship_id);
          return { success: false };
        }

        internshipTitle = internship.title;

        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", internship.organization_id)
          .single();

        organizationName = org?.name ?? "Organization";
      } catch (dbErr) {
        const msg = dbErr instanceof Error ? dbErr.message : "DB error";
        console.error("[EMAIL] DB fallback failed for rejection, logging instead. Error: " + msg);
        return { success: false, error: "DB unreachable, email not sent" };
      }
    }

    const supabase = createClient();
    const result = await sendEmailWithLog(supabase, {
      applicationId,
      emailType: "rejected",
      recipientEmail: to,
      subject: "Update regarding your internship application",
      send: () =>
        sendRejectionEmail({
          to,
          applicantName,
          internshipTitle,
          organizationName,
        }),
    });

    if (!result.success && !result.skipped) {
      console.error("[EMAIL] Rejection email failed:", result.error);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EMAIL] sendRejectionEmailAction error:", message);
    return { success: false, error: message };
  }
}

/**
 * Fetches application + internship details and sends a shortlisted email.
 * Accepts optional pre-fetched applicant details to avoid DB queries.
 * Uses the same dedup strategy as rejection (per application + recipient).
 * Fire-and-forget: logs failures but never throws.
 */
export async function sendShortlistedEmailAction(
  applicationId: string,
  preFetched?: {
    applicantName?: string;
    applicantEmail?: string;
    internshipTitle?: string;
    organizationName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    let to = preFetched?.applicantEmail || "";
    let applicantName = preFetched?.applicantName || "";
    let internshipTitle = preFetched?.internshipTitle || "";
    let organizationName = preFetched?.organizationName || "";

    // Resolve from DB when pre-fetched details are missing (or the org name is
    // unknown — otherwise the email would read "at Organization").
    if (!to || !applicantName || !internshipTitle || !organizationName) {
      try {
        const supabase = createClient();
        const { data: application } = await supabase
          .from("applications")
          .select("applicant_name, email, internship_id")
          .eq("id", applicationId)
          .single();

        if (!application || !application.email) {
          console.error("[EMAIL] Application not found for shortlisted email:", applicationId);
          return { success: false, error: "Applicant not found" };
        }

        to = application.email;
        applicantName = application.applicant_name;

        const { data: internship } = await supabase
          .from("internships")
          .select("title, organization_id")
          .eq("id", application.internship_id)
          .single();

        if (!internship) {
          console.error("[EMAIL] Internship not found:", application.internship_id);
          return { success: false };
        }

        internshipTitle = internship.title;

        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", internship.organization_id)
          .single();

        organizationName = org?.name ?? "Organization";
      } catch (dbErr) {
        const msg = dbErr instanceof Error ? dbErr.message : "DB error";
        console.error("[EMAIL] DB fallback failed for shortlisted email. Error: " + msg);
        return { success: false, error: "DB unreachable, email not sent" };
      }
    }

    const supabase = createClient();
    const result = await sendEmailWithLog(supabase, {
      applicationId,
      emailType: "shortlisted",
      recipientEmail: to,
      subject: "Congratulations! You've been shortlisted 🎉",
      send: () =>
        sendShortlistedEmail({
          to,
          applicantName,
          internshipTitle,
          organizationName,
        }),
    });

    if (!result.success && !result.skipped) {
      console.error("[EMAIL] Shortlisted email failed:", result.error);
    }

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EMAIL] sendShortlistedEmailAction error:", message);
    return { success: false, error: message };
  }
}
