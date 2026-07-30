import type { SupabaseClient } from "@supabase/supabase-js";

export interface StarredCandidate {
  id: string;
  recruiter_id: string;
  application_id: string;
  created_at: string;
}

/** Star (favorite) a candidate. */
export async function starCandidate(
  supabase: SupabaseClient,
  recruiterId: string,
  applicationId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("starred_candidates").insert({
    recruiter_id: recruiterId,
    application_id: applicationId,
  });
  if (error) return { error: error.message };
  return { error: null };
}

/** Unstar a candidate. */
export async function unstarCandidate(
  supabase: SupabaseClient,
  recruiterId: string,
  applicationId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("starred_candidates")
    .delete()
    .eq("recruiter_id", recruiterId)
    .eq("application_id", applicationId);
  if (error) return { error: error.message };
  return { error: null };
}

/** Get all starred candidate IDs for a recruiter. */
export async function getStarredCandidateIds(
  supabase: SupabaseClient,
  recruiterId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("starred_candidates")
    .select("application_id")
    .eq("recruiter_id", recruiterId);

  if (error || !data) return [];
  return data.map((d) => d.application_id);
}

/** Check if a specific candidate is starred. */
export async function isStarred(
  supabase: SupabaseClient,
  recruiterId: string,
  applicationId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("starred_candidates")
    .select("id")
    .eq("recruiter_id", recruiterId)
    .eq("application_id", applicationId)
    .single();
  return !!data;
}

/** Toggle star status. */
export async function toggleStar(
  supabase: SupabaseClient,
  recruiterId: string,
  applicationId: string
): Promise<{ starred: boolean; error: string | null }> {
  const currentlyStarred = await isStarred(supabase, recruiterId, applicationId);
  if (currentlyStarred) {
    const { error } = await unstarCandidate(supabase, recruiterId, applicationId);
    return { starred: false, error: error ? error : null };
  } else {
    const { error } = await starCandidate(supabase, recruiterId, applicationId);
    return { starred: true, error: error ? error : null };
  }
}
