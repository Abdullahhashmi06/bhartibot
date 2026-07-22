import type { SupabaseClient } from "@supabase/supabase-js";
import { QuestionType, ScreeningQuestion } from "@/lib/types";

/** Screening questions for one internship, oldest first. */
export async function getInternshipQuestions(
  supabase: SupabaseClient,
  internshipId: string
): Promise<ScreeningQuestion[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, internship_id, question, type, created_at")
    .eq("internship_id", internshipId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getInternshipQuestions failed:", error.message);
    return [];
  }
  return (data as ScreeningQuestion[]) ?? [];
}

/** Add one screening question to an internship. */
export async function createQuestion(
  supabase: SupabaseClient,
  internshipId: string,
  question: string,
  type: QuestionType
): Promise<{ question: ScreeningQuestion | null; error: string | null }> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { question: null, error: "Question text is required." };
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      internship_id: internshipId,
      question: trimmed,
      type,
    })
    .select("id, internship_id, question, type, created_at")
    .single();

  if (error || !data) {
    return {
      question: null,
      error: error?.message ?? "Failed to add question.",
    };
  }

  return { question: data as ScreeningQuestion, error: null };
}

/** Delete one screening question by id. */
export async function deleteQuestion(
  supabase: SupabaseClient,
  questionId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
