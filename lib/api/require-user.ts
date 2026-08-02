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
