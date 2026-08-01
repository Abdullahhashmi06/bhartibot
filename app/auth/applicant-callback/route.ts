import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Applicant OAuth callback (Google).
 *
 * Exchanges the OAuth `code` for a session, ensures an `applicant_profiles`
 * row exists for the user, then redirects into the applicant portal.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/applicant";

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
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
