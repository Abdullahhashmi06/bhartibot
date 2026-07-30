import type { SupabaseClient } from "@supabase/supabase-js";

export type InterviewType = "online" | "on_site" | "phone";
export type InterviewStatus = "not_scheduled" | "scheduled" | "completed" | "cancelled" | "offer_sent" | "rejected";
export type OverallDecision = "hire" | "hold" | "reject";

export interface Interview {
  id: string;
  application_id: string;
  recruiter_id: string;
  interview_date: string;
  interview_time: string;
  interview_type: InterviewType;
  interviewer_name: string;
  meeting_link: string | null;
  notes: string | null;
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
    .single();

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
    interview_type: InterviewType;
    interviewer_name: string;
    meeting_link?: string;
    notes?: string;
  }
): Promise<{ interview: Interview | null; error: string | null }> {
  const existing = await getInterview(supabase, applicationId);

  if (existing) {
    const { data: updated, error } = await supabase
      .from("interviews")
      .update({
        interview_date: data.interview_date,
        interview_time: data.interview_time,
        interview_type: data.interview_type,
        interviewer_name: data.interviewer_name,
        meeting_link: data.meeting_link || null,
        notes: data.notes || null,
        status: "scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return { interview: null, error: error.message };
    return { interview: updated as Interview, error: null };
  }

  const { data: created, error } = await supabase
    .from("interviews")
    .insert({
      application_id: applicationId,
      recruiter_id: recruiterId,
      interview_date: data.interview_date,
      interview_time: data.interview_time,
      interview_type: data.interview_type,
      interviewer_name: data.interviewer_name,
      meeting_link: data.meeting_link || null,
      notes: data.notes || null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return { interview: null, error: error.message };
  return { interview: created as Interview, error: null };
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
