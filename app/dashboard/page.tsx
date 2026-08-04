import { redirect } from "next/navigation";
import { Users, PlusCircle } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterInternships } from "@/lib/queries/internships";
import { getApplicationsCountByInternship } from "@/lib/queries/applications";
import { getDashboardAnalytics } from "@/lib/queries/dashboard";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string) || null;
  const orgName = (user.user_metadata?.organization_name as string) || null;

  // All analytics + internships + per-internship application counts come from a
  // single consolidated fetch (getDashboardAnalytics), avoiding a duplicate
  // internships query and N count queries per role.
  const {
    stats,
    recentActivity,
    topUniversities,
    topSkills,
    internships: analyticsInternships,
    applicationsCountByInternship,
    orgResolved,
  } = await getDashboardAnalytics(supabase);

  // Legacy fallback: when the recruiter's organization cannot be resolved (no
  // profile row yet), getDashboardAnalytics returns empty — re-fetch through the
  // org/RLS-scoped helpers so the internship list still renders exactly as before.
  let internships = analyticsInternships;
  let counts = applicationsCountByInternship;
  if (!orgResolved) {
    internships = await getRecruiterInternships(supabase);
    const countEntries = await Promise.all(
      internships.map(async (i) => [i.id, await getApplicationsCountByInternship(supabase, i.id)] as const)
    );
    counts = Object.fromEntries(countEntries);
  }

  // Combine internship data with counts and real AI scores from DB
  const internshipsWithData = internships.map((internship) => ({
    ...internship,
    applicantCount: counts[internship.id] ?? 0,
    aiScoreAverage: stats.aiScoresByInternship[internship.id] ?? 0
  }));

  return (
    <Shell userEmail={user.email} userName={fullName || orgName || undefined}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Tag tone="teal">Recruiter Workspace</Tag>
          </div>
          <h1 className="mt-2 font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-primary">
            Welcome back{fullName ? `, ${fullName}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {orgName || user.email} · Managing {stats.activeInternships} active internship recruitment drives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink
            href="/dashboard/applications"
            variant="secondary"
            leftIcon={<Users className="h-4 w-4" />}
          >
            All Applications
          </ButtonLink>
          <ButtonLink
            href="/dashboard/create-internship"
            variant="gradient"
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Create Internship
          </ButtonLink>
        </div>
      </div>

      <div className="mt-4">
        <DashboardClient 
          stats={stats}
          internships={internshipsWithData}
          recentActivity={recentActivity}
          topUniversities={topUniversities}
          topSkills={topSkills}
        />
      </div>
    </Shell>
  );
}
