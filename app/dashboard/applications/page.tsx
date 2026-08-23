import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users, Sparkles, XCircle, Clock, PlusCircle, ArrowLeft, Briefcase } from "lucide-react";
import Tag from "@/components/ui/Tag";
import MetricCard from "@/components/ai/MetricCard";
import { ButtonLink } from "@/components/ui/Button";
import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import { getRecruiterInternships } from "@/lib/queries/internships";
import { getOrgApplicationStats } from "@/lib/queries/applications";

export const dynamic = "force-dynamic";

export default async function ApplicationsDashboardPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = (user.user_metadata?.full_name as string) || null;
  const internships = await getRecruiterInternships(supabase);
  const internshipIds = internships.map((i) => i.id);

  // Batch: one stats query + one applications fetch instead of N count queries
  const [stats, allApps] = await Promise.all([
    getOrgApplicationStats(supabase, internshipIds),
    internshipIds.length > 0
      ? supabase.from("applications").select("internship_id").in("internship_id", internshipIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Count per internship in JS — single query instead of N
  const countMap = new Map<string, number>();
  internshipIds.forEach((id) => countMap.set(id, 0));
  (allApps.data ?? []).forEach((row: { internship_id: string }) => {
    countMap.set(row.internship_id, (countMap.get(row.internship_id) ?? 0) + 1);
  });

  const internshipsWithCounts = internships.map((internship) => ({
    ...internship,
    count: countMap.get(internship.id) ?? 0,
  }));

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Tag tone="teal">Applications Hub</Tag>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-primary">
            All Applications Pool
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            Select an internship drive to review candidate profiles, CV evidence, and AI recommendations.
          </p>
        </div>

        <ButtonLink href="/dashboard" variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Dashboard Overview
        </ButtonLink>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total Applications"
          value={stats.total}
          icon={<Users className="h-4 w-4" />}
          tone="navy"
        />
        <MetricCard
          label="New / Pending"
          value={stats.new}
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
        />
        <MetricCard
          label="Shortlisted Candidates"
          value={stats.shortlisted}
          icon={<Sparkles className="h-4 w-4" />}
          tone="emerald"
        />
        <MetricCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      {/* INTERNSHIP SELECTION GRID */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-primary">
              Filter Applications by Internship Role
            </h2>
            <p className="text-xs text-text-secondary">
              Click any role to view the candidate table, AI match scores, and status pipelines.
            </p>
          </div>
        </div>

        {internshipsWithCounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white py-20 px-6 text-center shadow-subtle">
            <Briefcase className="h-12 w-12 text-text-muted" />
            <p className="text-sm text-text-secondary font-medium">No internships found.</p>
            <ButtonLink href="/dashboard/create-internship" variant="gradient" leftIcon={<PlusCircle className="h-4 w-4" />}>
              Create Internship Drive
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {internshipsWithCounts.map((internship) => (
              <Link
                key={internship.id}
                href={`/dashboard/applications/${internship.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-white p-6 shadow-card hover:shadow-hover hover:border-teal transition-all duration-200"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-xl text-primary group-hover:text-teal-dark transition-colors truncate">
                      {internship.title}
                    </h3>
                    <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
                      {internship.status}
                    </Tag>
                  </div>
                  <p className="text-xs text-text-secondary font-medium truncate">
                    {[internship.location, internship.work_mode, internship.duration]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex items-center gap-5 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="font-display font-extrabold text-3xl text-primary group-hover:text-teal-dark transition-colors">
                      {internship.count}
                    </span>
                    <p className="text-xs text-text-muted font-mono uppercase tracking-wider">
                      {internship.count === 1 ? "Application" : "Applications"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-text-muted border border-border group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
