"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInterviewEmail, sendRejectionEmail } from "@/lib/notifications/email";
import { hasRejectionEmailBeenSent, markRejectionEmailSent } from "@/lib/notifications/logger";

type InterviewEmailParams = {
  applicationId: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  interviewType: "online" | "on_site" | "phone";
  meetingLink?: string | null;
  venue?: string | null;
  notes?: string | null;
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
      // Log the email params as fallback so it's visible in server logs
      console.log("[EMAIL FALLBACK] Interview email would be sent to application " + params.applicationId);
      return { success: false, error: "Could not resolve applicant details" };
    }

    const result = await sendInterviewEmail({
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
    });

    if (!result.success) {
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
 * Uses dedup via hasRejectionEmailBeenSent to prevent duplicate sends.
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

    // If the 3 critical fields are provided, use them directly without DB
    if (to && applicantName && internshipTitle && !organizationName) {
      organizationName = "Organization";
    }

    // If details are missing, try DB
    if (!to || !applicantName || !internshipTitle) {
      try {
        const supabase = createClient();

        const { data: application } = await supabase
          .from("applications")
          .select("applicant_name, email, internship_id")
          .eq("id", applicationId)
          .single();

        if (!application || !application.email) {
          console.error("[EMAIL] Application not found for rejection email:", applicationId);
          console.log("[EMAIL FALLBACK] Rejection email would be sent for application " + applicationId);
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
        console.log("[EMAIL FALLBACK] Rejection for application " + applicationId + " (DB unreachable)");
        return { success: false, error: "DB unreachable, email not sent" };
      }
    }

    // Dedup check — skip if already sent for this recipient + application
    if (to && hasRejectionEmailBeenSent(to, applicationId)) {
      return { success: true };
    }

    const result = await sendRejectionEmail({
      to,
      applicantName,
      internshipTitle,
      organizationName,
    });

    if (result.success) {
      if (to) markRejectionEmailSent(to, applicationId);
    } else if (result.skipped) {
      // Provider not configured — not a real failure. Don't mark dedup so a
      // future send (once RESEND_API_KEY is set) still fires.
      console.warn("[EMAIL] Rejection email skipped (RESEND_API_KEY not configured)");
    } else {
      console.error("[EMAIL] Rejection email failed:", result.error);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EMAIL] sendRejectionEmailAction error:", message);
    return { success: false, error: message };
  }
}
