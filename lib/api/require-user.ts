import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Returns the signed-in user for an API route, or null when unauthenticated.
 * Use in route handlers to protect endpoints that cost money (AI calls) or
 * expose data — mirrors the pattern used by /api/ai/interview-questions and
 * /api/ai/resume-analysis.
 */
export async function requireUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the signed-in user ONLY when they are a recruiter (have a row in
 * `profiles`), or null otherwise. Recruiter-only AI endpoints must use this
 * instead of requireUser() so applicants cannot burn AI credits or probe
 * recruiter tooling. RLS on `profiles` (select own) keeps this scoped.
 */
export async function requireRecruiter(): Promise<User | null> {
  const user = await requireUser();
  if (!user) return null;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return profile ? user : null;
}
