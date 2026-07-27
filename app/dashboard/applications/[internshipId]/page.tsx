import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import ApplicantList from "@/components/applications/ApplicantList";
import { createClient } from "@/lib/supabase/server";
import { getApplicationsByInternship } from "@/lib/queries/applications";
import { getRecruiterInternships } from "@/lib/queries/internships";

export default async function InternshipApplicantsPage({
  params,
}: {
  params: { internshipId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const internships = await getRecruiterInternships(supabase);
  const internship = internships.find((i) => i.id === params.internshipId);
  if (!internship) notFound();

  const applications = await getApplicationsByInternship(
    supabase,
    params.internshipId
  );

  // Per-status counts
  const newCount = applications.filter((a) => a.status === "new").length;
  const underReview = applications.filter(
    (a) => a.status === "under_review"
  ).length;
  const shortlisted = applications.filter(
    (a) => a.status === "shortlisted"
  ).length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <Link
          href="/dashboard/applications"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          All Internships
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-medium text-ink">
                {internship.title}
              </h1>
              <Tag
                tone={internship.status === "published" ? "teal" : "neutral"}
              >
                {internship.status}
              </Tag>
            </div>
            <p className="mt-1 text-sm text-muted">
              {[internship.location, internship.work_mode]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <Link
            href={`/internships/${internship.public_slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Edit / Manage →
          </Link>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label="Total"
            value={applications.length}
            tone="ink"
          />
          <MiniStat label="New" value={newCount} tone="neutral" />
          <MiniStat label="Shortlisted" value={shortlisted} tone="teal" />
          <MiniStat label="Rejected" value={rejected} tone="rose" />
        </div>

        {/* Under-review note */}
        {underReview > 0 && (
          <p className="text-xs text-muted font-mono">
            + {underReview} under review
          </p>
        )}

        {/* Applicant list with search/filter (client component) */}
        {applications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-20 text-center">
            <Users size={32} className="text-muted/40" />
            <p className="text-sm text-muted">No applications yet.</p>
            {internship.status !== "published" && (
              <p className="text-xs text-muted">
                Publish this internship to start receiving applications.
              </p>
            )}
          </div>
        ) : (
          <ApplicantList
            applications={applications}
            internshipId={params.internshipId}
          />
        )}
      </div>
    </Shell>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "neutral" | "teal" | "rose";
}) {
  const bg = {
    ink: "bg-ink text-paper",
    neutral: "bg-white border-border text-muted",
    teal: "bg-teal/10 border-teal/30 text-[#1D6E63]",
    rose: "bg-rose/10 border-rose/30 text-[#8A3A20]",
  }[tone];

  return (
    <div className={`rounded-md border p-4 ${bg}`}>
      <p className="font-display text-2xl font-medium">{value}</p>
      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider opacity-70">
        {label}
      </p>
    </div>
  );
}
