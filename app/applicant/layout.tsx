import { redirect } from "next/navigation";
import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import ApplicantSidebar from "@/components/applicant/ApplicantSidebar";

export const dynamic = "force-dynamic";

/**
 * Layout architecture (matches the recruiter Shell pattern):
 *  - `<main>` is the flex child that reserves the fixed w-64 sidebar's space
 *    via `lg:pl-64`. It carries NO other padding utilities, so nothing can
 *    ever override the 16rem offset (the old bug stacked `lg:px-10` /
 *    `xl:px-12` on the same element and collapsed the offset on desktop).
 *  - A dedicated inner container owns ALL content padding + the max-width,
 *    so every applicant page starts at the exact same X position.
 */
function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-w-0 lg:pl-64 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
        {children}
      </div>
    </main>
  );
}

export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Use middleware-injected identity — avoids a redundant getUser() round-trip
  const headerUser = getUserFromHeaders();
  if (!headerUser) {
    redirect("/applicant-auth");
  }
  // Still call getUser() once to get the full user object for profile creation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/applicant-auth");
  }

  // Use maybeSingle to avoid errors when profile doesn't exist yet
  const { data: profile } = await supabase
    .from("applicant_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If no profile exists yet, try to create one automatically
  if (!profile) {
    let attemptCount = 0;
    let newProfile = null;

    while (attemptCount < 2 && !newProfile) {
      const { error: insertError } = await supabase.from("applicant_profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
        role: "applicant",
      });

      if (insertError) {
        console.error("Failed to auto-create applicant profile (attempt " + (attemptCount + 1) + "):", insertError.message);
      }

      // Re-fetch after insert attempt
      const { data: fetched } = await supabase
        .from("applicant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      newProfile = fetched;
      attemptCount++;
      if (!newProfile && attemptCount < 2) {
        // Small delay before retry (RLS propagation)
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (!newProfile) {
      // Still no profile — render a fallback instead of redirecting to avoid loop
      console.warn("Could not create applicant profile after retries, showing fallback");
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col lg:flex-row antialiased">
        <ApplicantSidebar userEmail={user.email} userName={user.user_metadata?.full_name as string || "Applicant"} />
        <AppContent>
          <div className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-8 text-center shadow-card">
            <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-2">
              Welcome to InternIQ!
            </h2>
            <p className="text-text-secondary dark:text-slate-400 mb-6">
              Your profile is being set up. Please visit your profile page to complete your information.
            </p>
            <a href="/applicant/profile" className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-6 py-3 text-sm font-semibold shadow-teal hover:opacity-90 transition-all">
              Complete Profile
            </a>
          </div>
          {children}
        </AppContent>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col lg:flex-row antialiased">
      <ApplicantSidebar userEmail={user.email} userName={newProfile.full_name} />
      <AppContent>{children}</AppContent>
    </div>
  );
}

// Check role — but be lenient. If no role is set, allow through
if (profile.role && profile.role !== "applicant") {
  redirect("/dashboard");
}

// If profile has no role, set it to applicant
if (!profile.role) {
  await supabase
    .from("applicant_profiles")
    .update({ role: "applicant" })
    .eq("id", user.id);
}

return (
  <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col lg:flex-row antialiased">
    <ApplicantSidebar userEmail={user.email} userName={profile.full_name} />
    <AppContent>{children}</AppContent>
  </div>
);
}
