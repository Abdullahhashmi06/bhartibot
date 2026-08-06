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
    .maybeSingle();

  if (error || !data) {
    console.warn(
      "[getCurrentOrganizationId] Could not resolve org for user:",
      error?.message ?? "no profile row"
    );
    return null;
  }
  return data.organization_id as string;
}

/**
 * Fetch one internship by its public slug — scoped to the current recruiter's
 * organization so a recruiter can never view/edit another org's internship.
 * (The public apply page uses getPublishedInternshipBySlug instead.)
 */
export async function getInternshipBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Internship | null> {
  const organizationId = await getCurrentOrganizationId(supabase);

  let query = supabase
    .from("internships")
    .select("*")
    .eq("public_slug", slug);

  // Defense-in-depth: prefer the org filter. If the org can't be resolved
  // (e.g. profile row missing before the backfill migration runs), fall back
  // to an RLS-enforced query so pages never 404 for the owner. The RLS policy
  // internships_select_own_org restricts reads to the caller's own org.
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    console.warn("[getInternshipBySlug] Org unresolved — relying on RLS.");
  }

  const { data, error } = await query.single();

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

/**
 * All internships belonging to the current recruiter's organization.
 *
 * IMPORTANT: scoped by organization_id. Without this, a recruiter would see
 * (and be able to edit) every internship in the database — a data-isolation
 * violation. RLS policies double-check the same rule server-side.
 */
export async function getRecruiterInternships(
  supabase: SupabaseClient,
  status?: string
): Promise<Internship[]> {
  const organizationId = await getCurrentOrganizationId(supabase);

  let query = supabase
    .from("internships")
    .select("*")
    .order("created_at", { ascending: false });

  // Defense-in-depth: prefer the org filter. If the org can't be resolved
  // (e.g. profile row missing before the backfill migration runs), fall back
  // to an RLS-enforced query so the dashboard never goes empty. RLS policies
  // (internships_select_own_org) restrict reads to the caller's own org.
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    console.warn("[getRecruiterInternships] Org unresolved — relying on RLS.");
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getRecruiterInternships failed:", error.message);
    return [];
  }
  return (data as Internship[]) ?? [];
}

/**
 * True when the logged-in recruiter's organization owns the given internship.
 * Used as a code-level guard on every mutation (defense in depth over RLS).
 */
export async function canAccessInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<boolean> {
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) return false;

  const { data, error } = await supabase
    .from("internships")
    .select("organization_id")
    .eq("id", internshipId)
    .single();

  if (error || !data) return false;
  return data.organization_id === organizationId;
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
      github_required: input.github_required ?? false,
      linkedin_required: input.linkedin_required ?? false,
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
  if (!(await canAccessInternship(supabase, internshipId))) {
    return { internship: null, error: "You do not have permission to modify this internship." };
  }

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
  if (!(await canAccessInternship(supabase, internshipId))) {
    return { internship: null, error: "You do not have permission to modify this internship." };
  }

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

/** Update editable fields on an existing internship (title, description, requirements, profile-link requirements). */
export async function updateInternship(
  supabase: SupabaseClient,
  internshipId: string,
  patch: {
    title?: string;
    description?: string;
    requirements?: Requirement[];
    github_required?: boolean;
    linkedin_required?: boolean;
    stipend?: string | null;
    deadline?: string | null;
    internship_type?: string | null;
  }
): Promise<{ internship: Internship | null; error: string | null }> {
  if (!(await canAccessInternship(supabase, internshipId))) {
    return { internship: null, error: "You do not have permission to modify this internship." };
  }

  const updates: Record<string, string | boolean | null> = {};
  if (patch.title !== undefined) {
    updates.title = patch.title;
    updates.public_slug = slugify(patch.title);
  }
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.github_required !== undefined) updates.github_required = patch.github_required;
  if (patch.linkedin_required !== undefined) updates.linkedin_required = patch.linkedin_required;
  if (patch.stipend !== undefined) updates.stipend = patch.stipend;
  if (patch.deadline !== undefined) updates.deadline = patch.deadline;
  if (patch.internship_type !== undefined) updates.internship_type = patch.internship_type;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("internships")
      .update(updates)
      .eq("id", internshipId);

    if (error) {
      return { internship: null, error: error?.message ?? "Failed to update internship." };
    }
  }

  if (patch.requirements !== undefined) {
    await supabase.from("requirements").delete().eq("internship_id", internshipId);

    const rows = patch.requirements
      .filter((r) => r.requirement.trim().length > 0)
      .map((r) => ({ internship_id: internshipId, requirement: r.requirement.trim(), type: r.type }));

    if (rows.length > 0) {
      const { error: reqErr } = await supabase.from("requirements").insert(rows);
      if (reqErr) {
        return { internship: null, error: `Internship updated, but requirements failed: ${reqErr.message}` };
      }
    }
  }

  const { data: fresh } = await supabase
    .from("internships")
    .select("*")
    .eq("id", internshipId)
    .single();

  return { internship: (fresh as Internship) ?? null, error: null };
}

export async function duplicateInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<{ internship: Internship | null; error: string | null }> {
  if (!(await canAccessInternship(supabase, internshipId))) {
    return { internship: null, error: "You do not have permission to duplicate this internship." };
  }

  const { data: original, error: fetchError } = await supabase
    .from("internships")
    .select("*")
    .eq("id", internshipId)
    .single();

  if (fetchError || !original) {
    return { internship: null, error: fetchError?.message ?? "Internship not found." };
  }

  const newTitle = `${original.title} (Copy)`;
  const { data: copy, error: copyError } = await supabase
    .from("internships")
    .insert({
      organization_id: original.organization_id,
      title: newTitle,
      field: original.field,
      description: original.description,
      location: original.location,
      work_mode: original.work_mode,
      duration: original.duration,
      status: "draft",
      public_slug: slugify(newTitle) + "-" + Date.now().toString().slice(-4), // ensure uniqueness
    })
    .select()
    .single();

  if (copyError || !copy) {
    return { internship: null, error: copyError?.message ?? "Failed to duplicate internship." };
  }

  const { data: reqs } = await supabase
    .from("requirements")
    .select("requirement, type")
    .eq("internship_id", internshipId);

  if (reqs && reqs.length > 0) {
    const newReqs = reqs.map(r => ({ ...r, internship_id: copy.id }));
    await supabase.from("requirements").insert(newReqs);
  }

  const { data: qs } = await supabase
    .from("questions")
    .select("question, type")
    .eq("internship_id", internshipId);

  if (qs && qs.length > 0) {
    const newQs = qs.map(q => ({ ...q, internship_id: copy.id }));
    await supabase.from("questions").insert(newQs);
  }

  return { internship: copy as Internship, error: null };
}

export async function archiveInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<{ internship: Internship | null; error: string | null }> {
  if (!(await canAccessInternship(supabase, internshipId))) {
    return { internship: null, error: "You do not have permission to modify this internship." };
  }

  const { data, error } = await supabase
    .from("internships")
    .update({ status: "archived" })
    .eq("id", internshipId)
    .select()
    .single();

  if (error || !data) {
    return { internship: null, error: error?.message ?? "Failed to archive internship." };
  }
  return { internship: data as Internship, error: null };
}

export async function restoreInternship(
  supabase: SupabaseClient,
  internshipId: string
): Promise<{ internship: Internship | null; error: string | null }> {
  if (!(await canAccessInternship(supabase, internshipId))) {
    return { internship: null, error: "You do not have permission to modify this internship." };
  }

  const { data, error } = await supabase
    .from("internships")
    .update({ status: "draft" })
    .eq("id", internshipId)
    .select()
    .single();

  if (error || !data) {
    return { internship: null, error: error?.message ?? "Failed to restore internship." };
  }
  return { internship: data as Internship, error: null };
}
