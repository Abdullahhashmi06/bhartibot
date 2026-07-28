import type { SupabaseClient } from "@supabase/supabase-js";
import { Application, ApplicationStatus, NewApplicationInput } from "@/lib/types";

/**
 * Submit a student application plus screening answers.
 * cv_path is left null until Day 7 storage upload is wired.
 */
export async function createApplication(
  supabase: SupabaseClient,
  input: NewApplicationInput
): Promise<{ application: Application | null; error: string | null }> {
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .insert({
      internship_id: input.internship_id,
      applicant_name: input.applicant_name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      university: input.university?.trim() || null,
      degree: input.degree?.trim() || null,
      semester: input.semester?.trim() || null,
      cgpa: input.cgpa?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      github_url: input.github_url?.trim() || null,
      portfolio_url: input.portfolio_url?.trim() || null,

      cv_path: input.cv_path ?? null,

      status: "new",
    })
    .select()
    .single();

  if (applicationError || !application) {
    return {
      application: null,
      error: applicationError?.message ?? "Failed to submit application.",
    };
  }

  if (input.answers.length > 0) {
    const answerRows = input.answers.map((a) => ({
      application_id: application.id,
      question_id: a.question_id,
      answer: a.answer.trim(),
    }));

    const { error: answersError } = await supabase
      .from("answers")
      .insert(answerRows);

    if (answersError) {
      return {
        application: application as Application,
        error: `Application saved, but screening answers failed: ${answersError.message}`,
      };
    }
  }

  return { application: application as Application, error: null };
}

/** All applications for a specific internship (recruiter view). */
export async function getApplicationsByInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("internship_id", internshipId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getApplicationsByInternship failed:", error.message);
    return [];
  }
  return (data as Application[]) ?? [];
}

/** Fetch a single application by ID. */
export async function getApplicationById(
  supabase: SupabaseClient,
  applicationId: string
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (error || !data) return null;
  return data as Application;
}

/** Fetch screening answers for a given application, joined with question text. */
export async function getApplicationAnswers(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ question: string; answer: string }[]> {
  const { data, error } = await supabase
    .from("answers")
    .select("answer, questions(question)")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map(
    (row: {
      answer: string;
      questions: { question: string }[] | null;
    }) => ({
      question: row.questions?.[0]?.question ?? "Unknown question",
      answer: row.answer,
    })
  );
}

/** Update an application's recruiter-facing status. */
export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  status: ApplicationStatus
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) return { error: error.message };
  return { error: null };
}

/** Count of applications per internship for the current org. */
export async function getApplicationsCountByInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("internship_id", internshipId);

  if (error) return 0;
  return count ?? 0;
}

/** Aggregate stats for all applications across the recruiter's internships. */
export async function getOrgApplicationStats(
  supabase: SupabaseClient
): Promise<{ total: number; new: number; shortlisted: number; rejected: number }> {
  const { data, error } = await supabase
    .from("applications")
    .select("status");

  if (error || !data) return { total: 0, new: 0, shortlisted: 0, rejected: 0 };

  const total = data.length;
  const newCount = data.filter((a) => a.status === "new").length;
  const shortlisted = data.filter((a) => a.status === "shortlisted").length;
  const rejected = data.filter((a) => a.status === "rejected").length;

  return { total, new: newCount, shortlisted, rejected };
}
