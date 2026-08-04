import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/**
 * Applicant OAuth callback (Google).
 *
 * Exchanges the OAuth `code` for a session, ensures an `applicant_profiles`
 * row exists for the user, then redirects into the applicant portal.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Open-redirect guard: only a relative path may be used as the redirect target.
  const next = safeRedirectPath(searchParams.get("next"), "/applicant");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Reuse the same profile-creation logic the applicant auth page uses.
      const { data: existing } = await supabase
        .from("applicant_profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existing) {
        const name =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "";
        await supabase.from("applicant_profiles").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: name,
          role: "applicant",
        });
      }

      // The on_auth_user_created trigger runs at user creation (before OAuth
      // metadata carries a role hint), so Google applicants may have gotten a
      // spurious recruiter profile + empty org. Remove it now that the
      // applicant profile is guaranteed to exist.
      await supabase.rpc("remove_spurious_recruiter_profile", {
        p_user_id: data.user.id,
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
