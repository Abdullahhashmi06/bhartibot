import type { SupabaseClient } from "@supabase/supabase-js";
import { Application, NewApplicationInput } from "@/lib/types";

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
