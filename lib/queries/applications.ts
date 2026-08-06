import type { SupabaseClient } from "@supabase/supabase-js";
import { Application, ApplicationStatus, NewApplicationInput } from "@/lib/types";

export interface ApplicationWithScore extends Application {
  match_score: number | null;
}

/** Submit a student application plus screening answers. */
export async function createApplication(
  supabase: SupabaseClient,
  input: NewApplicationInput
): Promise<{ application: Application | null; error: string | null }> {
  // ── Deadline guard ────────────────────────────────────────────────────────
  // Applicants cannot apply once the internship deadline has passed (the DB
  // trigger enforces this too; this check gives a clean, immediate message).
  const { data: internshipRow } = await supabase
    .from("internships")
    .select("deadline")
    .eq("id", input.internship_id)
    .maybeSingle();

  if (internshipRow?.deadline) {
    const deadline = new Date(internshipRow.deadline);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
      return {
        application: null,
        error: "Applications for this internship are closed — the application deadline has passed.",
      };
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── Duplicate guard ────────────────────────────────────────────────────────
  // Prevent the same email from submitting more than once per internship.
  const { data: existingApp } = await supabase
    .from("applications")
    .select("id")
    .eq("internship_id", input.internship_id)
    .eq("email", input.email.toLowerCase().trim())
    .limit(1)
    .maybeSingle();

  if (existingApp) {
    return {
      application: null,
      error: "You have already applied for this internship. Only one application per email is allowed.",
    };
  }
  // ──────────────────────────────────────────────────────────────────────────

  const applicationId = crypto.randomUUID();

  const { error: applicationError } = await supabase
    .from("applications")
    .insert({
      id: applicationId,
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
    });

  if (applicationError) {
    return {
      application: null,
      error: applicationError.message ?? "Failed to submit application.",
    };
  }

  // Create a minimal Application object to return (status is known)
  const application: Application = {
    id: applicationId,
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
    created_at: new Date().toISOString(),
  };

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

/**
 * Batched variant of getApplicationAnswers for multiple applications.
 * One round-trip instead of N, grouped by application_id. Used by the
 * comparison page.
 */
export async function getApplicationAnswersForApplications(
  supabase: SupabaseClient,
  applicationIds: string[]
): Promise<Record<string, { question: string; answer: string }[]>> {
  if (applicationIds.length === 0) return {};

  const { data, error } = await supabase
    .from("answers")
    .select("application_id, answer, questions(question)")
    .in("application_id", applicationIds)
    .order("created_at", { ascending: true });

  if (error || !data) return {};

  const grouped: Record<string, { question: string; answer: string }[]> = {};
  (data as {
    application_id: string;
    answer: string;
    questions: { question: string }[] | null;
  }[]).forEach((row) => {
    if (!grouped[row.application_id]) grouped[row.application_id] = [];
    grouped[row.application_id].push({
      question: row.questions?.[0]?.question ?? "Unknown question",
      answer: row.answer,
    });
  });
  return grouped;
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

  if (error) {
    console.warn(
      "[getApplicationsCountByInternship] query failed (RLS/permission issue?), returning 0:",
      error.message
    );
    return 0;
  }
  return count ?? 0;
}

/** Aggregate stats for all applications across the recruiter's internships.
 * @param internshipIds - Optional array of internship IDs to scope the query.
 *   If provided, only applications for those internships are counted.
 *   If empty, returns zeroed stats immediately (no DB query needed).
 */
export async function getOrgApplicationStats(
  supabase: SupabaseClient,
  internshipIds?: string[]
): Promise<{ total: number; new: number; shortlisted: number; rejected: number }> {
  // If explicitly passed an empty array, there's nothing to count
  if (internshipIds !== undefined && internshipIds.length === 0) {
    return { total: 0, new: 0, shortlisted: 0, rejected: 0 };
  }

  let query = supabase.from("applications").select("status");

  // Scope to recruiter's internships when IDs are provided
  if (internshipIds && internshipIds.length > 0) {
    query = query.in("internship_id", internshipIds);
  }

  const { data, error } = await query;

  // console.log("==========");
  // console.log("Internship IDs:", internshipIds);
  // console.log("Applications:", data);
  // console.log("Error:", error);
  // console.log("==========");

  if (error) {
    console.warn(
      "[getOrgApplicationStats] query failed (RLS/permission issue?), returning zeros:",
      error.message
    );
    return { total: 0, new: 0, shortlisted: 0, rejected: 0 };
  }

  if (!data) return { total: 0, new: 0, shortlisted: 0, rejected: 0 };

  const total = data.length;
  const newCount = data.filter((a) => a.status === "new").length;
  const shortlisted = data.filter((a) => a.status === "shortlisted").length;
  const rejected = data.filter((a) => a.status === "rejected").length;

  return { total, new: newCount, shortlisted, rejected };
}

/** Check if an application already exists for the given email + internship combo. */
export async function checkDuplicateApplication(
  supabase: SupabaseClient,
  internshipId: string,
  email: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("internship_id", internshipId)
    .eq("email", email.toLowerCase().trim())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("checkDuplicateApplication error:", error.message);
    return false; // err on the side of allowing submission
  }
  return data !== null;
}

/** Bulk update statuses for multiple applications. */
export async function bulkUpdateApplicationStatus(
  supabase: SupabaseClient,
  applicationIds: string[],
  status: ApplicationStatus
): Promise<{ error: string | null }> {
  if (applicationIds.length === 0) return { error: null };
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .in("id", applicationIds);
  if (error) return { error: error.message };
  return { error: null };
}

/** Bulk delete multiple applications. */
export async function bulkDeleteApplications(
  supabase: SupabaseClient,
  applicationIds: string[]
): Promise<{ error: string | null }> {
  if (applicationIds.length === 0) return { error: null };
  const { error } = await supabase
    .from("applications")
    .delete()
    .in("id", applicationIds);
  if (error) return { error: error.message };
  return { error: null };
}

/** Fetch applications for an internship, joined with their AI match scores. */
export async function getApplicationsWithScores(
  supabase: SupabaseClient,
  internshipId: string
): Promise<ApplicationWithScore[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, candidate_ai_analysis(match_score)")
    .eq("internship_id", internshipId)
    .order("created_at", { ascending: false });

  // If the AI-analysis join fails (e.g. candidate_ai_analysis table missing
  // because a migration wasn't applied), NEVER hide applications from the
  // recruiter — fall back to a plain query and leave match_score null.
  if (error) {
    console.warn(
      "[getApplicationsWithScores] Join failed, falling back:",
      error.message
    );
    const { data: plain, error: plainError } = await supabase
      .from("applications")
      .select("*")
      .eq("internship_id", internshipId)
      .order("created_at", { ascending: false });
    if (plainError) {
      console.error(
        "[getApplicationsWithScores] Plain fallback failed:",
        plainError.message
      );
      return [];
    }
    return (plain ?? []).map((row) => ({ ...row, match_score: null }));
  }

  return (data ?? []).map((row: Application & { candidate_ai_analysis: { match_score: number }[] | null }) => ({
    ...row,
    match_score:
      Array.isArray(row.candidate_ai_analysis) && row.candidate_ai_analysis.length > 0
        ? row.candidate_ai_analysis[0].match_score
        : null,
  })) as ApplicationWithScore[];
}

/** Fetch multiple applications by their IDs (for comparison page). */
export async function getApplicationsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Application[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .in("id", ids);
  if (error || !data) return [];
  return data as Application[];
}
