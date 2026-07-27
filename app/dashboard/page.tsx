import { redirect } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import { ButtonLink } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterInternships } from "@/lib/queries/internships";
import {
  getApplicationsCountByInternship,
  getOrgApplicationStats,
} from "@/lib/queries/applications";

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
  const internships = await getRecruiterInternships(supabase);
  const stats = await getOrgApplicationStats(supabase);

  const counts = await Promise.all(
    internships.map((i) => getApplicationsCountByInternship(supabase, i.id))
  );

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <Tag tone="teal">Recruiter Dashboard</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            Welcome{fullName ? `, ${fullName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">{orgName || user.email}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <ButtonLink href="/dashboard/applications" variant="secondary">
            📋 Applications
          </ButtonLink>
          <ButtonLink href="/dashboard/create-internship">
            + Create Internship
          </ButtonLink>
          <LogoutButton />
        </div>
      </div>

      {/* Stats bar */}
      {stats.total > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-md border border-border bg-white px-5 py-3 text-sm text-muted">
          <span className="font-medium text-text">{stats.total} total applications</span>
          <span>·</span>
          <span>{stats.new} new</span>
          <span>·</span>
          <span className="text-teal font-medium">{stats.shortlisted} shortlisted</span>
          {stats.rejected > 0 && (
            <>
              <span>·</span>
              <span className="text-rose">{stats.rejected} rejected</span>
            </>
          )}
          <Link
            href="/dashboard/applications"
            className="ml-auto text-xs font-medium text-ink hover:underline"
          >
            View all →
          </Link>
        </div>
      )}

      {internships.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <h2 className="font-display text-lg font-medium text-ink">
            Your Internships
          </h2>
          <p className="max-w-xs text-sm text-muted">
            You haven&apos;t created any internships yet. Once you do, they&apos;ll
            show up here with applicant counts and status.
          </p>
          <ButtonLink href="/dashboard/create-internship" className="mt-4">
            + Create Internship
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-8">
          <h2 className="font-display text-lg font-medium text-ink">
            Your Internships
          </h2>
          {internships.map((internship, idx) => (
            <div
              key={internship.id}
              className="flex items-center justify-between rounded-md border border-border bg-white p-4 transition-colors hover:border-ink"
            >
              <Link
                href={`/internships/${internship.public_slug}`}
                className="flex-1 min-w-0"
              >
                <h3 className="font-display text-base font-medium text-ink">
                  {internship.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted">
                  {internship.location}
                  {internship.work_mode ? ` · ${internship.work_mode}` : ""}
                </p>
              </Link>
              <div className="flex items-center gap-3 ml-4 shrink-0 flex-wrap justify-end">
                <Link
                  href={`/dashboard/applications/${internship.id}`}
                  className="text-sm text-muted hover:text-ink transition-colors"
                >
                  <span className="font-display font-medium text-ink">
                    {counts[idx]}
                  </span>{" "}
                  {counts[idx] === 1 ? "applicant" : "applicants"}
                </Link>
                <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
                  {internship.status}
                </Tag>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
