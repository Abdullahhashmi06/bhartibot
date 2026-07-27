import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users, Sparkles, XCircle, Clock } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterInternships } from "@/lib/queries/internships";
import {
  getApplicationsCountByInternship,
  getOrgApplicationStats,
} from "@/lib/queries/applications";

export default async function ApplicationsDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const internships = await getRecruiterInternships(supabase);
  const stats = await getOrgApplicationStats(supabase);

  // Fetch counts for each internship in parallel
  const counts = await Promise.all(
    internships.map((i) => getApplicationsCountByInternship(supabase, i.id))
  );

  const internshipsWithCounts = internships.map((internship, idx) => ({
    ...internship,
    count: counts[idx],
  }));

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Recruiter Dashboard
          </p>
          <h1 className="mt-2 font-display text-2xl font-medium text-ink">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage applicants across all your internships.
          </p>
        </div>
        <ButtonLink href="/dashboard" variant="secondary">
          ← Dashboard
        </ButtonLink>
      </div>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={stats.total}
          color="ink"
          icon={<Users size={16} />}
        />
        <StatCard
          label="New"
          value={stats.new}
          color="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          label="Shortlisted"
          value={stats.shortlisted}
          color="teal"
          icon={<Sparkles size={16} />}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          color="rose"
          icon={<XCircle size={16} />}
        />
      </div>

      {/* Internship list */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-medium text-ink">
          My Internships
        </h2>
        <p className="mt-1 text-sm text-muted">
          Click an internship to view all its applicants.
        </p>

        {internshipsWithCounts.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted">No internships found.</p>
            <ButtonLink href="/dashboard/create-internship" className="mt-2">
              + Create Internship
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {internshipsWithCounts.map((internship) => (
              <Link
                key={internship.id}
                href={`/dashboard/applications/${internship.id}`}
                className="group flex items-center justify-between rounded-md border border-border bg-white p-5 transition-all hover:border-ink hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-base font-medium text-ink truncate">
                      {internship.title}
                    </h3>
                    <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
                      {internship.status}
                    </Tag>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {[internship.location, internship.work_mode]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-display font-medium text-ink">
                      {internship.count}
                    </p>
                    <p className="text-xs text-muted">
                      {internship.count === 1 ? "Application" : "Applications"}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-ink"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "ink" | "amber" | "teal" | "rose";
  icon: React.ReactNode;
}) {
  const colorMap = {
    ink: "bg-white border-border",
    amber: "bg-amber/5 border-amber/30",
    teal: "bg-teal/5 border-teal/30",
    rose: "bg-rose/5 border-rose/30",
  };
  const textMap = {
    ink: "text-ink",
    amber: "text-[#8A5A16]",
    teal: "text-[#1D6E63]",
    rose: "text-[#8A3A20]",
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-md border p-4 ${colorMap[color]}`}
    >
      <div className={`flex items-center gap-1.5 ${textMap[color]}`}>
        {icon}
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`font-display text-3xl font-medium ${textMap[color]}`}>
        {value}
      </p>
    </div>
  );
}
