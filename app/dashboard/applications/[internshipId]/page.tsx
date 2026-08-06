import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Briefcase, Plus, Sparkles } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import MetricCard from "@/components/ai/MetricCard";
import ApplicantList from "@/components/applications/ApplicantList";
import ExportActions from "@/components/applications/ExportActions";
import { createClient } from "@/lib/supabase/server";
import { getApplicationsWithScores } from "@/lib/queries/applications";
import { getRecruiterInternships } from "@/lib/queries/internships";

export const dynamic = "force-dynamic";

export default async function InternshipApplicantsPage({
  params,
  searchParams,
}: {
  params: { internshipId: string };
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const internships = await getRecruiterInternships(supabase);
  const internship = internships.find((i) => i.id === params.internshipId);
  if (!internship) notFound();

  const allApplications = await getApplicationsWithScores(
    supabase,
    params.internshipId
  );

  const newCount = allApplications.filter((a) => a.status === "new").length;
  const underReview = allApplications.filter(
    (a) => a.status === "under_review"
  ).length;
  const shortlisted = allApplications.filter(
    (a) => a.status === "shortlisted"
  ).length;
  const rejected = allApplications.filter((a) => a.status === "rejected").length;

  const currentTab = searchParams.tab || "all";
  let displayedApplications = allApplications;
  
  if (currentTab === "all") {
    displayedApplications = allApplications;
  } else if (currentTab === "new") {
    displayedApplications = allApplications.filter((a) => a.status === "new");
  } else if (currentTab === "under_review") {
    displayedApplications = allApplications.filter((a) => a.status === "under_review");
  } else if (currentTab === "shortlisted") {
    displayedApplications = allApplications.filter((a) => a.status === "shortlisted");
  } else if (currentTab === "rejected") {
    displayedApplications = allApplications.filter((a) => a.status === "rejected");
  } else if (currentTab === "archived") {
    displayedApplications = allApplications.filter((a) => a.status === "archived");
  }

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

          <div className="flex items-center gap-2">
            <ExportActions
              applications={allApplications as any}
              internshipTitle={internship.title}
              variant="bulk"
            />
            <Link
              href={`/internships/${internship.public_slug}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-text-primary dark:text-white hover:border-teal hover:text-teal-dark shadow-subtle transition-all"
            >
              <Briefcase className="h-3.5 w-3.5 text-teal" />
              Edit Internship Settings
            </Link>
          </div>
        </div>

        {/* Role Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary dark:text-white tracking-tight">
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
            value={allApplications.length}
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

        {/* TABS */}
        <div className="flex flex-wrap gap-2 border-b border-border">
          {[
            { id: "all", label: "All", count: allApplications.length },
            { id: "new", label: "New Applicants", count: newCount },
            { id: "under_review", label: "Under Review", count: underReview },
            { id: "shortlisted", label: "Shortlisted", count: shortlisted },
            { id: "rejected", label: "Rejected", count: rejected },
            { id: "archived", label: "Archived", count: allApplications.filter((a) => a.status === "archived").length },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/dashboard/applications/${params.internshipId}?tab=${tab.id}`}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-teal text-teal-dark dark:text-teal"
                    : "border-transparent text-text-muted hover:border-border hover:text-primary dark:hover:text-white"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isActive ? "bg-teal text-white" : "bg-slate-100 text-text-secondary dark:bg-slate-800 dark:text-text-muted"
                }`}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* APPLICANT LIST COMPONENT WITH SEARCH & FILTERS */}
        {displayedApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-white dark:bg-slate-800 py-20 text-center shadow-subtle mt-4">
            <Users className="h-12 w-12 text-text-muted" />
            <div className="space-y-1">
              <p className="text-base font-bold text-primary dark:text-white">No Applications Found</p>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                {currentTab === "all"
                  ? (internship.status === "published"
                      ? "Share your public link to start collecting PDF resumes."
                      : "Publish this internship to enable public candidate submissions.")
                  : "No applications match the current tab filter."}
              </p>
            </div>
            {internship.status !== "published" && currentTab === "all" && (
              <Link
                href={`/internships/${internship.public_slug}`}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-4 py-2 text-xs font-semibold shadow-teal"
              >
                Publish Internship Drive
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <ApplicantList
              applications={displayedApplications}
              internshipId={params.internshipId}
            />
          </div>
        )}
      </div>
    </Shell>
  );
}
