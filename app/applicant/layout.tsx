import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicantSidebar from "@/components/applicant/ApplicantSidebar";

export const dynamic = "force-dynamic";

export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

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
        <div className="min-h-screen bg-background dark:bg-slate-950 flex">
          <ApplicantSidebar userEmail={user.email} userName={user.user_metadata?.full_name as string || "Applicant"} />
          <main className="flex-1 lg:pl-64 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8">
            <div className="max-w-7xl mx-auto w-full">
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
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex">
        <ApplicantSidebar userEmail={user.email} userName={newProfile.full_name} />
        <main className="flex-1 lg:pl-64 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
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
    <div className="min-h-screen bg-background dark:bg-slate-950 flex">
      <ApplicantSidebar userEmail={user.email} userName={profile.full_name} />
      <main className="flex-1 lg:pl-64 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
