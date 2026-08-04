import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/**
 * Recruiter OAuth callback (Google).
 *
 * Exchanges the OAuth `code` for a session, then guarantees the recruiter
 * profile + organisation exist (idempotent — never creates duplicates), so a
 * brand-new Google user is immediately routed into a working recruiter
 * workspace. Existing users are simply logged in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Open-redirect guard: only a relative path may be used as the redirect target.
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const name =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        "";
      const orgName =
        (data.user.user_metadata?.organization_name as string) ||
        "Unnamed Organization";

      // Idempotent: returns the existing org id when the profile is already
      // present (covers existing accounts and the handle_new_user trigger).
      const { error: rpcError } = await supabase.rpc("ensure_recruiter_profile", {
        p_user_id: data.user.id,
        p_email: data.user.email ?? "",
        p_full_name: name,
        p_organization_name: orgName,
      });

      if (rpcError) {
        // Non-fatal: the trigger usually provisions on signup; log so failures
        // are visible in server logs without breaking the redirect.
        console.error(
          "[auth/callback] ensure_recruiter_profile failed:",
          rpcError.message
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
