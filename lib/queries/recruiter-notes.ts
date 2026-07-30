import type { SupabaseClient } from "@supabase/supabase-js";

export interface RecruiterNote {
  id: string;
  application_id: string;
  recruiter_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  recruiter_email?: string;
}

/** Fetch all notes for a given application (newest first). */
export async function getNotesByApplication(
  supabase: SupabaseClient,
  applicationId: string
): Promise<RecruiterNote[]> {
  const { data, error } = await supabase
    .from("recruiter_notes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[RecruiterNotes] getNotesByApplication:", error.message);
    return [];
  }
  return (data as RecruiterNote[]) ?? [];
}

/** Create a new recruiter note. */
export async function createRecruiterNote(
  supabase: SupabaseClient,
  applicationId: string,
  recruiterId: string,
  content: string
): Promise<RecruiterNote | null> {
  const { data, error } = await supabase
    .from("recruiter_notes")
    .insert({
      application_id: applicationId,
      recruiter_id: recruiterId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("[RecruiterNotes] createRecruiterNote:", error.message);
    return null;
  }
  return data as RecruiterNote;
}

/** Update an existing recruiter note. */
export async function updateRecruiterNote(
  supabase: SupabaseClient,
  noteId: string,
  content: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("recruiter_notes")
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", noteId);

  if (error) return { error: error.message };
  return { error: null };
}

/** Delete a recruiter note. */
export async function deleteRecruiterNote(
  supabase: SupabaseClient,
  noteId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("recruiter_notes")
    .delete()
    .eq("id", noteId);

  if (error) return { error: error.message };
  return { error: null };
}
