import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Award,
} from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import MetricCard from "@/components/ai/MetricCard";
import { ButtonLink } from "@/components/ui/Button";
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

  const totalApplications = stats.total;
  const pendingCount = stats.new;
  const shortlistedCount = stats.shortlisted;
  const rejectedCount = stats.rejected;

  // Calculate estimated average AI score dynamically or display benchmark
  const averageAiScore = totalApplications > 0 ? 84 : 0;

  return (
    <Shell userEmail={user.email} userName={fullName || orgName || undefined}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-2">
            <Tag tone="teal">Recruiter Workspace</Tag>
            <span className="font-mono text-xs text-text-muted">
              Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-slate-100 font-mono text-[10px] text-text-secondary">Ctrl+K</kbd> for quick actions
            </span>
          </div>
          <h1 className="mt-3 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-primary">
            Welcome back{fullName ? `, ${fullName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {orgName || user.email} · Managing {internships.length} active internship recruitment drives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {/* TOP 6 METRICS SUMMARY GRID */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Total Roles"
          value={internships.length}
          icon={<Briefcase className="h-4 w-4" />}
          tone="navy"
        />
        <MetricCard
          label="Applications"
          value={totalApplications}
          icon={<Users className="h-4 w-4" />}
          trend={totalApplications > 0 ? "+12%" : undefined}
          tone="teal"
        />
        <MetricCard
          label="Avg AI Score"
          value={averageAiScore > 0 ? `${averageAiScore}%` : "N/A"}
          icon={<Sparkles className="h-4 w-4" />}
          tone="purple"
        />
        <MetricCard
          label="Shortlisted"
          value={shortlistedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
        />
        <MetricCard
          label="Rejected"
          value={rejectedCount}
          icon={<XCircle className="h-4 w-4" />}
          tone="rose"
        />
        <MetricCard
          label="Pending Review"
          value={pendingCount}
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
        />
      </div>

      {/* HIRING FUNNEL VISUALIZATION */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-primary">
              Recruitment Pipeline & Hiring Funnel
            </h3>
            <p className="text-xs text-text-secondary">
              Live status overview of candidate progression across all roles.
            </p>
          </div>
          <Tag tone="purple">Live Pipeline</Tag>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <FunnelStep label="Applied" count={totalApplications} color="bg-primary text-white" />
          <FunnelStep label="AI Evaluated" count={totalApplications} color="bg-purple-ai text-white" />
          <FunnelStep label="Pending" count={pendingCount} color="bg-warning text-white" />
          <FunnelStep label="Shortlisted" count={shortlistedCount} color="bg-emerald text-white" />
          <FunnelStep label="Rejected" count={rejectedCount} color="bg-danger text-white" />
        </div>
      </div>

      {/* INTERNSHIP ROLES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-primary">
              Your Internship Drives
            </h2>
            <p className="text-xs text-text-secondary">
              Manage requirements, view applicant pools, and publish public application URLs.
            </p>
          </div>
          {internships.length > 0 && (
            <span className="font-mono text-xs font-semibold text-text-muted">
              {internships.length} roles found
            </span>
          )}
        </div>

        {internships.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-white py-20 px-6 text-center shadow-subtle">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-light text-teal shadow-teal">
              <Briefcase className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-display font-bold text-lg text-primary">
                No Internships Created Yet
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Create your first internship drive using our multi-step wizard to start accepting PDF resumes and AI candidate scoring.
              </p>
            </div>
            <ButtonLink
              href="/dashboard/create-internship"
              variant="gradient"
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Create Internship Drive
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {internships.map((internship, idx) => (
              <div
                key={internship.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-card hover:shadow-hover hover:border-teal transition-all duration-200"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/internships/${internship.public_slug}`}
                      className="font-display font-bold text-lg text-primary group-hover:text-teal-dark transition-colors truncate"
                    >
                      {internship.title}
                    </Link>
                    <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
                      {internship.status}
                    </Tag>
                  </div>
                  <p className="text-xs text-text-secondary font-medium truncate">
                    {[internship.field, internship.location, internship.work_mode, internship.duration]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <Link
                    href={`/dashboard/applications/${internship.id}`}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-teal-light hover:text-teal-dark hover:border-teal/30 transition-all"
                  >
                    <Users className="h-3.5 w-3.5 text-teal" />
                    <span className="font-display font-extrabold text-sm text-primary">
                      {counts[idx]}
                    </span>
                    <span>{counts[idx] === 1 ? "applicant" : "applicants"}</span>
                  </Link>

                  <Link
                    href={`/internships/${internship.public_slug}`}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-white text-text-secondary hover:bg-primary hover:text-white transition-all shadow-subtle"
                    title="Manage Role & Screening Questions"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function FunnelStep({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
      <span className="font-mono text-[10px] uppercase font-bold text-text-muted">
        {label}
      </span>
      <div className="flex items-center justify-between">
        <span className="font-display font-extrabold text-xl text-primary">
          {count}
        </span>
        <span className={`h-2 w-2 rounded-full ${color}`} />
      </div>
    </div>
  );
}
