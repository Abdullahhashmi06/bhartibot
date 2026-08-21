import { Suspense } from "react";
import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import {
  getApplicantProfile,
  getApplicantApplications,
  getSavedJobs,
  getApplicantSkills,
  getApplicantProjects,
  getApplicantExperience,
  getProfileCompletionScore,
} from "@/lib/queries/applicant";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";
import { getApplicantInterviews } from "@/lib/queries/interview";
import ApplicantInterviews from "@/components/applicant/ApplicantInterviews";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import { Briefcase, Clock, ArrowRight, Sparkles } from "lucide-react";
import ProfileCompletion from "@/components/applicant/ProfileCompletion";
import ResumeHealth from "@/components/applicant/ResumeHealth";
import HomepageRecommendations from "@/components/applicant/HomepageRecommendations";
import ApplicantStats from "@/components/applicant/ApplicantStats";
import AiInsightsCard from "@/components/applicant/AiInsightsCard";
import CircularGauge from "@/components/ai/CircularGauge";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDateShort } from "@/lib/utils";
import type { RecommendationResult } from "@/lib/ai/recommendations";

export const dynamic = "force-dynamic";

/** Deterministic AI-insights computation from the recommendation feed. */
function buildInsights(recommendations: RecommendationResult[]): {
  topFields: string;
  topGapSkill: string | null;
  gapBoost: number | null;
  bestWorkMode: string | null;
  strengths: string[];
  hasSignal: boolean;
} {
  const hasSignal = recommendations.some(
    (r) => r.matchedSkills.length > 0 || r.profileCompleteness >= 40
  );
  if (!hasSignal || recommendations.length === 0) {
    return {
      topFields: "",
      topGapSkill: null,
      gapBoost: null,
      bestWorkMode: null,
      strengths: [],
      hasSignal: false,
    };
  }

  // Fields — weighted by match score
  const fieldScores = new Map<string, { total: number; count: number }>();
  recommendations.forEach((r) => {
    if (!r.field) return;
    const cur = fieldScores.get(r.field) ?? { total: 0, count: 0 };
    cur.total += r.matchScore;
    cur.count += 1;
    fieldScores.set(r.field, cur);
  });
  const fields = Array.from(fieldScores.entries())
    .map(([name, v]) => ({ name, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 2)
    .map((f) => f.name.replace(/\s*\/.*$/, "").trim());
  const topFields = fields.join(" and ");

  // Skill gaps — highest aggregate match gain
  const gapAgg = new Map<string, { gain: number; count: number }>();
  recommendations.forEach((r) => {
    r.skillGaps.forEach((g) => {
      const cur = gapAgg.get(g.skill) ?? { gain: 0, count: 0 };
      cur.gain += g.matchGain;
      cur.count += 1;
      gapAgg.set(g.skill, cur);
    });
  });
  const topGap = Array.from(gapAgg.entries())
    .map(([skill, v]) => ({ skill, avgGain: v.gain / v.count }))
    .sort((a, b) => b.avgGain - a.avgGain)[0];

  // Best work mode — highest avg acceptance
  const modeAgg = new Map<string, { total: number; count: number }>();
  recommendations.forEach((r) => {
    if (!r.work_mode) return;
    const cur = modeAgg.get(r.work_mode) ?? { total: 0, count: 0 };
    cur.total += r.acceptanceProbability;
    cur.count += 1;
    modeAgg.set(r.work_mode, cur);
  });
  const bestMode = Array.from(modeAgg.entries())
    .map(([mode, v]) => ({ mode, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];

  // Strengths — most frequent matched skills
  const skillCount = new Map<string, number>();
  recommendations.forEach((r) => {
    r.matchedSkills.forEach((s) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1));
  });
  const strengths = Array.from(skillCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  return {
    topFields,
    topGapSkill: topGap?.skill ?? null,
    gapBoost: topGap ? Math.max(2, Math.round(topGap.avgGain * 0.55)) : null,
    bestWorkMode: bestMode
      ? bestMode.mode.charAt(0).toUpperCase() + bestMode.mode.slice(1).replace("-", " ")
      : null,
    strengths,
    hasSignal: true,
  };
}

export default async function ApplicantDashboardPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) return null;
  const userId = headerUser.id;
  const userEmail = headerUser.email;

  // ── Fast queries (run in parallel, ~200-500ms total) ────────────────
  const [
    { data: profile },
    { data: applications },
    { data: savedJobs },
    { data: skills },
    { data: projects },
    { data: experience },
    { data: interviews },
  ] = await Promise.all([
    getApplicantProfile(supabase, userId),
    getApplicantApplications(supabase, userEmail),
    getSavedJobs(supabase, userId),
    getApplicantSkills(supabase, userId),
    getApplicantProjects(supabase, userId),
    getApplicantExperience(supabase, userId),
    getApplicantInterviews(supabase, userEmail),
  ]);

  const interviewCount = applications?.filter(a => a.status === 'interview').length || 0;
  const offerCount = applications?.filter(a => a.status === 'offer' || a.status === 'hired').length || 0;

  const stats = {
    total: applications?.length || 0,
    saved: savedJobs?.length || 0,
    underReview: applications?.filter(a => ['under_review', 'ai_reviewed', 'viewed'].includes(a.status)).length || 0,
    shortlisted: applications?.filter(a => ['shortlisted', 'interview'].includes(a.status)).length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    interviews: interviewCount,
    offers: offerCount,
  };

  const profileComplete = getProfileCompletionScore(profile, skills || [], projects || [], experience || []);

  return (
    <div className="space-y-10">
      {/* ══════════ HERO — renders immediately with fast queries ══════════ */}
      <Suspense fallback={
        <section className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-10 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="animate-shimmer h-6 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="animate-shimmer h-10 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="animate-shimmer h-4 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-shimmer h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                ))}
              </div>
            </div>
            <div className="shrink-0 mx-auto lg:mx-0">
              <div className="animate-shimmer h-40 w-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </section>
      }>
        <DeferredHeroAndRecommendations
          supabase={supabase}
          userId={userId}
          userEmail={userEmail}
          profile={profile}
          profileComplete={profileComplete}
          underReview={stats.underReview}
        />
      </Suspense>

      {/* ══════════ STATS — renders immediately ══════════ */}
      <ApplicantStats stats={stats} />

      {/* ══════════ INTERVIEWS — renders immediately ══════════ */}
      <ApplicantInterviews interviews={interviews || []} />

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
                      case "withdrawn": return { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700", border: "border-slate-200 dark:border-slate-600" };
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

/**
 * Deferred section: runs the expensive recommendations pipeline AFTER the
 * core dashboard (stats, interviews, recent applications) has already rendered.
 * Wrapped in <Suspense> in the parent — shows a skeleton while loading.
 */
async function DeferredHeroAndRecommendations({
  supabase,
  userId,
  userEmail,
  profile,
  profileComplete,
  underReview,
}: {
  supabase: any;
  userId: string;
  userEmail: string;
  profile: any;
  profileComplete: number;
  underReview: number;
}) {
  const engine = await getApplicantRecommendations(supabase, userId, userEmail);
  const { recommendations, savedJobIds, appliedJobIds } = engine;

  const recommendedCount = recommendations.length;
  const highAcceptanceCount = recommendations.filter(
    (r) => r.acceptanceProbability >= 70
  ).length;

  const insights = buildInsights(recommendations);

  const topRecommended = recommendations
    .filter((r) => r.overallScore >= 55 && r.matchScore >= 45)
    .slice(0, 3);

  const trending = [...recommendations]
    .sort((a, b) => b.applicant_count - a.applicant_count)
    .filter((r) => !topRecommended.some((t) => t.id === r.id))
    .slice(0, 5);

  const recentlyPosted = [...recommendations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((r) => !topRecommended.some((t) => t.id === r.id))
    .slice(0, 5);

  const closingSoon = [...recommendations]
    .filter((r) => r.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .filter((r) => !topRecommended.some((t) => t.id === r.id))
    .slice(0, 5);

  const savedRecs = recommendations.filter((r) => savedJobIds.includes(r.id)).slice(0, 5);
  const appliedRecs = recommendations.filter((r) => appliedJobIds.includes(r.id)).slice(0, 5);

  return (
    <>
      {/* Hero with recommendation metrics */}
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
              <HeroMetric value={underReview} label="Applications Under Review" tone="amber" />
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

      {/* AI Insights */}
      <AiInsightsCard data={insights} />

      {/* Personalized recommendation sections */}
      <HomepageRecommendations
        top={topRecommended}
        trending={trending}
        recentlyPosted={recentlyPosted}
        closingSoon={closingSoon}
        saved={savedRecs}
        applied={appliedRecs}
        savedJobIds={savedJobIds}
        appliedJobIds={appliedJobIds}
      />
    </>
  );
}
