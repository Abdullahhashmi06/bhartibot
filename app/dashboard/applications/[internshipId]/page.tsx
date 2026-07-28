import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Briefcase, Plus, Sparkles } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import MetricCard from "@/components/ai/MetricCard";
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

  const newCount = applications.filter((a) => a.status === "new").length;
  const underReview = applications.filter(
    (a) => a.status === "under_review"
  ).length;
  const shortlisted = applications.filter(
    (a) => a.status === "shortlisted"
  ).length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <Shell userEmail={user.email}>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> All Applications Hub
          </Link>

          <Link
            href={`/internships/${internship.public_slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-text-primary hover:border-teal hover:text-teal-dark shadow-subtle transition-all"
          >
            <Briefcase className="h-3.5 w-3.5 text-teal" />
            Edit Internship Settings
          </Link>
        </div>

        {/* Role Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary tracking-tight">
                {internship.title}
              </h1>
              <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
                {internship.status}
              </Tag>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary">
              {[internship.location, internship.work_mode, internship.duration]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {/* STATS METRICS GRID */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Total Applicants"
            value={applications.length}
            icon={<Users className="h-4 w-4" />}
            tone="navy"
          />
          <MetricCard
            label="New Applications"
            value={newCount}
            icon={<Sparkles className="h-4 w-4" />}
            tone="blue"
          />
          <MetricCard
            label="Shortlisted Pool"
            value={shortlisted}
            icon={<Sparkles className="h-4 w-4" />}
            tone="emerald"
          />
          <MetricCard
            label="Rejected"
            value={rejected}
            icon={<Users className="h-4 w-4" />}
            tone="rose"
          />
        </div>

        {/* APPLICANT LIST COMPONENT WITH SEARCH & FILTERS */}
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white py-20 text-center shadow-subtle">
            <Users className="h-12 w-12 text-text-muted" />
            <div className="space-y-1">
              <p className="text-base font-bold text-primary">No Applications Received Yet</p>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                {internship.status === "published"
                  ? "Share your public link to start collecting PDF resumes."
                  : "Publish this internship to enable public candidate submissions."}
              </p>
            </div>
            {internship.status !== "published" && (
              <Link
                href={`/internships/${internship.public_slug}`}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-4 py-2 text-xs font-semibold shadow-teal"
              >
                Publish Internship Drive
              </Link>
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
