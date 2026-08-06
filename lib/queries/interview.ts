import type { SupabaseClient } from "@supabase/supabase-js";

export type InterviewType = "online" | "on_site" | "phone";
export type InterviewStatus =
  | "not_scheduled"
  | "scheduled"
  | "accepted"
  | "declined"
  | "reschedule_requested"
  | "completed"
  | "cancelled"
  | "missed"
  | "offer_sent"
  | "rejected";
export type OverallDecision = "hire" | "hold" | "reject";

export interface Interview {
  id: string;
  application_id: string;
  recruiter_id: string;
  interview_date: string;
  interview_time: string;
  timezone: string | null;
  interview_type: InterviewType;
  interviewer_name: string;
  meeting_link: string | null;
  venue: string | null;
  notes: string | null;
  decline_reason: string | null;
  reschedule_requested_date: string | null;
  reschedule_requested_time: string | null;
  reschedule_request_note: string | null;
  reschedule_status: string | null;
  technical_rating: number | null;
  communication_rating: number | null;
  culture_fit: number | null;
  overall_recommendation: string | null;
  overall_decision: OverallDecision | null;
  status: InterviewStatus;
  feedback_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Get interview for an application. */
export async function getInterview(
  supabase: SupabaseClient,
  applicationId: string
): Promise<Interview | null> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Interview;
}

/** Create or update interview schedule. */
export async function upsertInterviewSchedule(
  supabase: SupabaseClient,
  applicationId: string,
  recruiterId: string,
  data: {
    interview_date: string;
    interview_time: string;
    timezone?: string;
    interview_type: InterviewType;
    interviewer_name: string;
    meeting_link?: string;
    venue?: string;
    notes?: string;
  }
): Promise<{ interview: Interview | null; error: string | null; updated: boolean }> {
  const existing = await getInterview(supabase, applicationId);

  if (existing) {
    const { data: updated, error } = await supabase
      .from("interviews")
      .update({
        interview_date: data.interview_date,
        interview_time: data.interview_time,
        timezone: data.timezone || null,
        interview_type: data.interview_type,
        interviewer_name: data.interviewer_name,
        meeting_link: data.meeting_link || null,
        venue: data.venue || null,
        notes: data.notes || null,
        status: "scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return { interview: null, error: error.message, updated: true };
    return { interview: updated as Interview, error: null, updated: true };
  }

  const { data: created, error } = await supabase
    .from("interviews")
    .insert({
      application_id: applicationId,
      recruiter_id: recruiterId,
      interview_date: data.interview_date,
      interview_time: data.interview_time,
      timezone: data.timezone || null,
      interview_type: data.interview_type,
      interviewer_name: data.interviewer_name,
      meeting_link: data.meeting_link || null,
      venue: data.venue || null,
      notes: data.notes || null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return { interview: null, error: error.message, updated: false };
  return { interview: created as Interview, error: null, updated: false };
}

/** Submit interview feedback. */
export async function submitInterviewFeedback(
  supabase: SupabaseClient,
  applicationId: string,
  data: {
    technical_rating: number;
    communication_rating: number;
    culture_fit: number;
    overall_recommendation: string;
    overall_decision: OverallDecision;
    feedback_notes?: string;
    status?: InterviewStatus;
  }
): Promise<{ error: string | null }> {
  const existing = await getInterview(supabase, applicationId);
  if (!existing) return { error: "No interview found. Please schedule first." };

  const { error } = await supabase
    .from("interviews")
    .update({
      technical_rating: data.technical_rating,
      communication_rating: data.communication_rating,
      culture_fit: data.culture_fit,
      overall_recommendation: data.overall_recommendation,
      overall_decision: data.overall_decision,
      feedback_notes: data.feedback_notes || null,
      status: data.status || "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) return { error: error.message };
  return { error: null };
}

/** Update interview status. */
export async function updateInterviewStatus(
  supabase: SupabaseClient,
  applicationId: string,
  status: InterviewStatus
): Promise<{ error: string | null }> {
  const existing = await getInterview(supabase, applicationId);
  if (!existing) return { error: "No interview found." };

  const { error } = await supabase
    .from("interviews")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", existing.id);

  if (error) return { error: error.message };
  return { error: null };
}

/* ── Applicant-facing interviews ──────────────────────────────────────── */

export interface ApplicantInterview {
  id: string;
  application_id: string;
  interview_date: string | null;
  interview_time: string | null;
  timezone: string | null;
  interview_type: InterviewType;
  interviewer_name: string | null;
  meeting_link: string | null;
  venue: string | null;
  notes: string | null;
  decline_reason: string | null;
  reschedule_requested_date: string | null;
  reschedule_requested_time: string | null;
  reschedule_request_note: string | null;
  reschedule_status: string | null;
  status: InterviewStatus;
  internship_id: string;
  internship_title: string;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the applicant's own interviews via the `applicant_interviews` view.
 * The view (security-definer, no user input) filters rows to applications whose
 * email matches the authenticated user, and exposes only safe columns — never
 * recruiter feedback/decisions/ratings. No RLS dependency on the caller.
 */
export async function getApplicantInterviews(
  supabase: SupabaseClient,
  email: string
): Promise<{ data: ApplicantInterview[]; error: string | null }> {
  if (!email) return { data: [], error: null };

  const { data, error } = await supabase
    .from("applicant_interviews")
    .select("*")
    .order("interview_date", { ascending: true })
    .order("interview_time", { ascending: true });

  if (error) {
    console.error("[INTERVIEW] getApplicantInterviews error:", error.message);
    return { data: [], error: error.message };
  }

  return { data: (data as unknown as ApplicantInterview[]) || [], error: null };
}
