import type { SupabaseClient } from "@supabase/supabase-js";
import { Application } from "@/lib/types";

export interface TalentPoolEntry {
  id: string;
  recruiter_id: string;
  application_id: string;
  notes: string;
  created_at: string;
  application?: Application & { match_score?: number | null; skills?: string[]; recommendation?: string };
}

/** Fetch all talent pool entries for a recruiter. */
export async function getTalentPool(
  supabase: SupabaseClient,
  recruiterId: string
): Promise<TalentPoolEntry[]> {
  const { data, error } = await supabase
    .from("talent_pool")
    .select("*, application:application_id(*)")
    .eq("recruiter_id", recruiterId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[TalentPool] getTalentPool:", error.message);
    return [];
  }
  return (data as any[]) ?? [];
}

/** Add an application to talent pool. */
export async function addToTalentPool(
  supabase: SupabaseClient,
  recruiterId: string,
  applicationId: string,
  notes: string = ""
): Promise<{ error: string | null }> {
  // Check if already in pool using maybeSingle to avoid errors on no rows
  const { data: existing } = await supabase
    .from("talent_pool")
    .select("id")
    .eq("recruiter_id", recruiterId)
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing) return { error: "Candidate already in talent pool" };

  const { error } = await supabase.from("talent_pool").insert({
    recruiter_id: recruiterId,
    application_id: applicationId,
    notes: notes.trim(),
  });

  if (error) return { error: error.message };
  return { error: null };
}

/** Remove an application from talent pool. */
export async function removeFromTalentPool(
  supabase: SupabaseClient,
  entryId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("talent_pool").delete().eq("id", entryId);
  if (error) return { error: error.message };
  return { error: null };
}

/** Update talent pool notes. */
export async function updateTalentPoolNotes(
  supabase: SupabaseClient,
  entryId: string,
  notes: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("talent_pool")
    .update({ notes: notes.trim() })
    .eq("id", entryId);
  if (error) return { error: error.message };
  return { error: null };
}

/** Check if an application is in talent pool. */
export async function isInTalentPool(
  supabase: SupabaseClient,
  recruiterId: string,
  applicationId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("talent_pool")
    .select("id")
    .eq("recruiter_id", recruiterId)
    .eq("application_id", applicationId)
    .maybeSingle();
  return !!data;
}

/** Search talent pool. */
export async function searchTalentPool(
  supabase: SupabaseClient,
  recruiterId: string,
  query: string
): Promise<TalentPoolEntry[]> {
  const all = await getTalentPool(supabase, recruiterId);
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter((entry) => {
    const a = entry.application;
    if (!a) return false;
    return (
      a.applicant_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.university ?? "").toLowerCase().includes(q) ||
      (a.degree ?? "").toLowerCase().includes(q) ||
      (a.cgpa ?? "").includes(q)
    );
  });
}
