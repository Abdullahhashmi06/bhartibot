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
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-border dark:border-slate-700 px-4 py-3.5 backdrop-blur">
      <p className={`font-display text-2xl font-extrabold ${tones[tone]}`}>{value}</p>
      <p className="text-[11px] font-semibold text-text-secondary dark:text-slate-400 mt-0.5">
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
  const { data, isLoading } = useQuery({
    queryKey: ["applicant-dashboard", userId],
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-dashboard");
      if (!res.ok) throw new Error("Failed to fetch applicant dashboard");
      return res.json();
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  // Show skeleton only when genuinely no cached data (first visit)
  if (isLoading || !data) {
    return (
      <div className="space-y-10">
        <section className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-10 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="animate-shimmer h-6 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="animate-shimmer h-10 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="animate-shimmer h-4 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="shrink-0 mx-auto lg:mx-0">
              <div className="animate-shimmer h-40 w-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-shimmer h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="animate-shimmer h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
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

  // Hero section — rendered directly by client component (no server component suspension)
  const recommendedCount = topRecommended?.length || 0;
  const highAcceptanceCount = (topRecommended || []).filter(
    (r: any) => r.acceptanceProbability >= 70
  ).length;

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-br from-teal-light/60 via-white to-emerald-light/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 sm:p-10 shadow-card">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-slate-800/80 border border-teal/20 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-teal-dark dark:text-teal">
              <Sparkles className="h-3.5 w-3.5" /> AI Career Advisor
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-extrabold text-primary dark:text-white tracking-tight leading-[1.15]">
              Welcome back, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "Applicant"}</span>.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary dark:text-slate-400">
              AI has analyzed your profile — here are the internships where you&apos;re currently most competitive.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <HeroMetric value={recommendedCount} label="Recommended Internships" tone="teal" />
              <HeroMetric value={highAcceptanceCount} label="High Acceptance Opportunities" tone="mint" />
              <HeroMetric value={underReview || stats.underReview} label="Applications Under Review" tone="amber" />
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/applicant/profile">
                <Button variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>Continue improving your profile</Button>
              </Link>
              <Link href="/applicant/internships">
                <Button variant="outline">Explore internships</Button>
              </Link>
            </div>
          </div>
          <div className="shrink-0 mx-auto lg:mx-0">
            <div className="relative flex flex-col items-center rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-border dark:border-slate-700 shadow-card px-8 py-6 backdrop-blur">
              <CircularGauge score={profileComplete} size={128} strokeWidth={10} label="Profile Complete" />
              <Link href="/applicant/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-dark dark:text-teal hover:underline">
                Complete it <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <ApplicantStats stats={stats} />

      {/* INTERVIEWS */}
      <ApplicantInterviews interviews={interviews || []} />

      {/* AI INSIGHTS (from deferred recommendations) */}
      {insights && <AiInsightsCard data={insights} />}

      {/* PERSONALIZED RECOMMENDATIONS */}
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

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-primary dark:text-white">
                  Recent Applications
                </h2>
                <p className="text-xs text-text-muted mt-0.5">Track your submitted applications</p>
              </div>
              <Link href="/applicant/applications">
                <Button variant="ghost" size="sm" className="text-teal">View All</Button>
              </Link>
            </div>
            {applications && applications.length > 0 ? (
              <div className="space-y-3">
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
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border dark:border-slate-700 hover:border-teal/30 hover:shadow-subtle transition-all duration-200 group gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-light to-emerald-light dark:from-teal/20 dark:to-emerald/15 border border-teal/15 dark:border-teal/25 flex items-center justify-center text-lg font-bold text-teal-dark dark:text-teal shrink-0">
                          {app.internships?.company_name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary dark:text-white group-hover:text-teal-dark dark:group-hover:text-teal transition-colors">{app.internships?.title || "Internship"}</h3>
                          <p className="text-sm text-text-secondary">{app.internships?.company_name || "Company"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConf.bg} ${statusConf.color} ${statusConf.border} border capitalize`}>
                          {app.status.replace("_", " ")}
                        </span>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDateShort(app.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-14 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No applications yet. Start exploring!</p>
                <Link href="/applicant/internships">
                  <Button variant="outline" className="mt-4">Find Internships</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <NotificationsPanel />
          <ProfileCompletion profile={profile} skills={skills || []} projects={projects || []} experience={experience || []} />
          <ResumeHealth profile={profile} skills={skills || []} projects={projects || []} experience={experience || []} />
        </div>
      </div>
    </div>
  );
}
