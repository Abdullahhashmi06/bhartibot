import type { SupabaseClient } from "@supabase/supabase-js";
import { Internship, NewInternshipInput, Requirement } from "@/lib/types";
import { slugify } from "@/lib/utils/slug";

/** The organization_id of the currently logged-in recruiter. */
export async function getCurrentOrganizationId(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data.organization_id as string;
}

/** Fetch one internship by its public slug (used on the detail page). */
export async function getInternshipBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Internship | null> {
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .eq("public_slug", slug)
    .single();

  if (error || !data) return null;
  return data as Internship;
}

/** Fetch a published internship by slug (public apply page). */
export async function getPublishedInternshipBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Internship | null> {
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .eq("public_slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return data as Internship;
}

/** All internships belonging to the current recruiter's organization. */
export async function getRecruiterInternships(
  supabase: SupabaseClient
): Promise<Internship[]> {
  const { data, error } = await supabase
    .from("internships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getRecruiterInternships failed:", error.message);
    return [];
  }
  return (data as Internship[]) ?? [];
}

/** Required + preferred requirement rows for one internship. */
export async function getInternshipRequirements(
  supabase: SupabaseClient,
  internshipId: string
): Promise<Requirement[]> {
  const { data, error } = await supabase
    .from("requirements")
    .select("id, requirement, type")
    .eq("internship_id", internshipId);

  if (error) {
    console.error("getInternshipRequirements failed:", error.message);
    return [];
  }
  return (data as Requirement[]) ?? [];
}

/**
 * Creates an internship + its requirements for the current recruiter's
 * organization. Row Level Security still double-checks organization_id
 * server-side — this function just supplies it.
 */
export async function createInternship(
  supabase: SupabaseClient,
  input: NewInternshipInput
): Promise<{ internship: Internship | null; error: string | null }> {
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return { internship: null, error: "No organization found for this account." };
  }

  const { data: internship, error: internshipError } = await supabase
    .from("internships")
    .insert({
      organization_id: organizationId,
      title: input.title,
      field: input.field,
      description: input.description,
      location: input.location,
      work_mode: input.work_mode,
      duration: input.duration,
      status: "draft",
      public_slug: slugify(input.title),
    })
    .select()
    .single();

  if (internshipError || !internship) {
    return { internship: null, error: internshipError?.message ?? "Failed to create internship." };
  }

  const requirementRows = input.requirements
    .filter((r) => r.requirement.trim().length > 0)
    .map((r) => ({
      internship_id: internship.id,
      requirement: r.requirement.trim(),
      type: r.type,
    }));

  if (requirementRows.length > 0) {
    const { error: requirementsError } = await supabase
      .from("requirements")
      .insert(requirementRows);

    if (requirementsError) {
      return { internship, error: `Internship saved, but requirements failed: ${requirementsError.message}` };
    }
  }

  const questionRows = (input.questions ?? [])
  .filter((q) => q.question.trim().length > 0)
  .map((q) => ({
    internship_id: internship.id,
    question: q.question.trim(),
    type: q.type,
  }));

  if (questionRows.length > 0) {
    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows);

      if (questionsError) {
        return {
          internship,
          error: `Internship saved, but questions failed: ${questionsError.message}`,
        };
      }
    }


  return { internship: internship as Internship, error: null };
}

/**
 * Publishes an internship: sets status to "published".
 * Ensures a public_slug exists so recruiters can share /apply/[slug].
 */
export async function publishInternship(
  supabase: SupabaseClient,
  internshipId: string,
  fallbackTitle: string
): Promise<{ internship: Internship | null; error: string | null }> {
  const { data: existing, error: fetchError } = await supabase
    .from("internships")
    .select("*")
    .eq("id", internshipId)
    .single();

  if (fetchError || !existing) {
    return {
      internship: null,
      error: fetchError?.message ?? "Internship not found.",
    };
  }

  const publicSlug =
    (existing.public_slug as string | null)?.trim() ||
    slugify(fallbackTitle || (existing.title as string) || "internship");

  const { data, error } = await supabase
    .from("internships")
    .update({
      status: "published",
      public_slug: publicSlug,
    })
    .eq("id", internshipId)
    .select()
    .single();

  if (error || !data) {
    return {
      internship: null,
      error: error?.message ?? "Failed to publish internship.",
    };
  }

  return { internship: data as Internship, error: null };
}

/** Moves a published internship back to draft (hides the public apply flow). */
export async function unpublishInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<{ internship: Internship | null; error: string | null }> {
  const { data, error } = await supabase
    .from("internships")
    .update({ status: "draft" })
    .eq("id", internshipId)
    .select()
    .single();

  if (error || !data) {
    return {
      internship: null,
      error: error?.message ?? "Failed to move internship to draft.",
    };
  }

  return { internship: data as Internship, error: null };
}
