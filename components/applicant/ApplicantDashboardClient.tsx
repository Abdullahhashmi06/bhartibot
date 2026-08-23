"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Briefcase, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ApplicantInterviews from "@/components/applicant/ApplicantInterviews";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import ProfileCompletion from "@/components/applicant/ProfileCompletion";
import ResumeHealth from "@/components/applicant/ResumeHealth";
import ApplicantStats from "@/components/applicant/ApplicantStats";
import CircularGauge from "@/components/ai/CircularGauge";
import AiInsightsCard from "@/components/applicant/AiInsightsCard";
import HomepageRecommendations from "@/components/applicant/HomepageRecommendations";
import { formatDateShort } from "@/lib/utils";

function HeroMetric({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "teal" | "mint" | "amber";
}) {
  const tones = {
    teal: "text-teal-dark dark:text-teal",
    mint: "text-emerald-dark dark:text-mint",
    amber: "text-warning dark:text-amber-300",
  };
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-border dark:border-slate-700 px-4 py-3 backdrop-blur">
      <p className={`font-display text-xl font-extrabold ${tones[tone]}`}>{value}</p>
      <p className="text-[10px] font-semibold text-text-secondary dark:text-slate-400 mt-0.5">
        {label}
      </p>
    </div>
  );
}

export default function ApplicantDashboardClient({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["applicant-dashboard", userId],
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-dashboard");
      if (!res.ok) throw new Error("Failed to fetch applicant dashboard");
      return res.json();
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  // Show error state if the query failed
  if (isError && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary">Failed to load dashboard data.</p>
        <p className="text-sm text-text-muted mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  // Show skeleton only when genuinely no cached data (first visit)
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="animate-shimmer h-5 w-36 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="animate-shimmer h-8 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="animate-shimmer h-3.5 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="shrink-0">
              <div className="animate-shimmer h-28 w-36 rounded-3xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-shimmer h-28 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="animate-shimmer h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    profile,
    applications,
    savedJobs,
    skills,
    projects,
    experience,
    interviews,
    profileComplete,
    insights,
    topRecommended,
    trending,
    recentlyPosted,
    closingSoon,
    savedRecs,
    appliedRecs,
    savedJobIds,
    appliedJobIds,
    underReview,
  } = data;

  const interviewCount = applications?.filter((a: any) => a.status === "interview").length || 0;
  const offerCount = applications?.filter((a: any) => a.status === "offer" || a.status === "hired").length || 0;

  const stats = {
    total: applications?.length || 0,
    saved: savedJobs?.length || 0,
    underReview: applications?.filter((a: any) => ["under_review", "ai_reviewed", "viewed"].includes(a.status)).length || 0,
    shortlisted: applications?.filter((a: any) => ["shortlisted", "interview"].includes(a.status)).length || 0,
    rejected: applications?.filter((a: any) => a.status === "rejected").length || 0,
    interviews: interviewCount,
    offers: offerCount,
  };

  const recommendedCount = topRecommended?.length || 0;
  const highAcceptanceCount = (topRecommended || []).filter(
    (r: any) => r.acceptanceProbability >= 70
  ).length;

  return (
    <div className="space-y-6">
      {/* ── HERO (compact) ── */}
      <section className="relative overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-br from-teal-light/60 via-white to-emerald-light/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-5 sm:p-7 shadow-card">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-emerald/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-slate-800/80 border border-teal/20 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-teal-dark dark:text-teal">
              <Sparkles className="h-3 w-3" /> AI Career Advisor
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-display font-extrabold text-primary dark:text-white tracking-tight leading-tight">
              Welcome back, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "Applicant"}</span>.
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary dark:text-slate-400">
              AI has analyzed your profile — here are your best-match opportunities.
            </p>

            {/* Compact inline metrics */}
            <div className="mt-4 flex flex-wrap gap-2.5">
              <HeroMetric value={recommendedCount} label="Recommended" tone="teal" />
              <HeroMetric value={highAcceptanceCount} label="High Match" tone="mint" />
              <HeroMetric value={underReview || stats.underReview} label="Under Review" tone="amber" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/applicant/profile">
                <Button variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>Complete Profile</Button>
              </Link>
              <Link href="/applicant/internships">
                <Button variant="outline" size="sm">Explore Internships</Button>
              </Link>
            </div>
          </div>
          <div className="shrink-0 mx-auto lg:mx-0">
            <div className="flex flex-col items-center rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-border dark:border-slate-700 shadow-card px-6 py-5 backdrop-blur">
              <CircularGauge score={profileComplete} size={100} strokeWidth={8} label="Profile" />
              <Link href="/applicant/profile" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-dark dark:text-teal hover:underline">
                Complete it <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS (compact row) ── */}
      <ApplicantStats stats={stats} />

      {/* ── AI INSIGHTS (inline, only when present) ── */}
      {insights && <AiInsightsCard data={insights} />}

      {/* ── MAIN CONTENT: 2-column on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* LEFT COLUMN — primary content */}
        <div className="space-y-6 min-w-0">
          {/* Recommendations */}
          {topRecommended && (
            <HomepageRecommendations
              top={topRecommended}
              trending={trending || []}
              recentlyPosted={recentlyPosted || []}
              closingSoon={closingSoon || []}
              saved={savedRecs || []}
              applied={appliedRecs || []}
              savedJobIds={savedJobIds || []}
              appliedJobIds={appliedJobIds || []}
            />
          )}

          {/* Recent Applications */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-bold text-primary dark:text-white">
                  Recent Applications
                </h2>
                <p className="text-[11px] text-text-muted mt-0.5">Track your submitted applications</p>
              </div>
              <Link href="/applicant/applications">
                <Button variant="ghost" size="sm" className="text-teal">View All</Button>
              </Link>
            </div>
            {applications && applications.length > 0 ? (
              <div className="space-y-2.5">
                {applications.slice(0, 5).map((app: any) => {
                  const getStatusConfig = (status: string) => {
                    switch (status) {
                      case "applied": case "under_review": return { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30" };
                      case "ai_reviewed": case "viewed": return { color: "text-teal-dark dark:text-teal", bg: "bg-teal-light dark:bg-teal/10", border: "border-teal/20" };
                      case "shortlisted": case "interview": return { color: "text-emerald-dark dark:text-emerald", bg: "bg-emerald-light dark:bg-emerald/10", border: "border-emerald/20" };
                      case "offer": case "hired": return { color: "text-emerald-dark dark:text-emerald", bg: "bg-mint-light dark:bg-mint/10", border: "border-mint/25" };
                      case "rejected": return { color: "text-danger dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-danger/20" };
                      default: return { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700", border: "border-slate-200 dark:border-slate-600" };
                    }
                  };
                  const statusConf = getStatusConfig(app.status);
                  return (
                    <div key={app.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-border dark:border-slate-700 hover:border-teal/30 hover:shadow-subtle transition-all duration-200 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-light to-emerald-light dark:from-teal/20 dark:to-emerald/15 border border-teal/15 dark:border-teal/25 flex items-center justify-center text-sm font-bold text-teal-dark dark:text-teal shrink-0">
                          {app.internships?.company_name?.charAt(0) || "C"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-primary dark:text-white group-hover:text-teal-dark dark:group-hover:text-teal transition-colors truncate">{app.internships?.title || "Internship"}</h3>
                          <p className="text-xs text-text-secondary truncate">{app.internships?.company_name || "Company"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${statusConf.bg} ${statusConf.color} ${statusConf.border} border capitalize`}>
                          {app.status.replace("_", " ")}
                        </span>
                        <p className="text-[10px] text-text-muted hidden sm:flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatDateShort(app.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-text-secondary text-sm font-medium">No applications yet. Start exploring!</p>
                <Link href="/applicant/internships">
                  <Button variant="outline" size="sm" className="mt-3">Find Internships</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Interviews */}
          <ApplicantInterviews interviews={interviews || []} />
        </div>

        {/* RIGHT COLUMN — sidebar */}
        <div className="space-y-5 min-w-0">
          <NotificationsPanel />
          <ProfileCompletion profile={profile} skills={skills || []} projects={projects || []} experience={experience || []} />
          <ResumeHealth profile={profile} skills={skills || []} projects={projects || []} experience={experience || []} />
        </div>
      </div>
    </div>
  );
}
