import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardStats, ActivityItem, Internship, Application, CandidateAiAnalysis, Requirement } from "@/lib/types";
import { getUserFromHeaders } from "@/lib/supabase/server";

export async function getDashboardAnalytics(supabase: SupabaseClient): Promise<{
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  topUniversities: { university: string; applicants: number; avgScore: number }[];
  topSkills: { skill: string; count: number }[];
  internships: Internship[];
  applicationsCountByInternship: Record<string, number>;
  weeklyApplications: { name: string; count: number }[];
  orgResolved: boolean;
}> {
  // 1. Get user identity from middleware headers — avoids redundant getUser()
  const headerUser = getUserFromHeaders();
  if (!headerUser) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", headerUser.id).maybeSingle();
  if (!profile) {
    console.warn("[getDashboardAnalytics] No profile row for user — returning empty stats.");
    return {
      stats: {
        totalInternships: 0,
        activeInternships: 0,
        archivedInternships: 0,
        totalApplications: 0,
        newApplications: 0,
        underReviewApplications: 0,
        shortlistedApplications: 0,
        rejectedApplications: 0,
        scheduledInterviews: 0,
        averageAiScore: 0,
        weeklyApplicationTrend: null,
        aiScoresByInternship: {},
        scoreDistribution: { excellent: 0, good: 0, average: 0, weak: 0 },
      },
      recentActivity: [],
      topUniversities: [],
      topSkills: [],
      internships: [],
      applicationsCountByInternship: {},
      weeklyApplications: [],
      orgResolved: false,
    };
  }

  const orgId = profile.organization_id;

  // 2. Fetch internships (depends on orgId)
  const { data: internships, error: internshipsError } = await supabase
    .from("internships")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false }) as { data: Internship[] | null; error: { message: string } | null };

  if (internshipsError) {
    console.warn(
      "[getDashboardAnalytics] internships query failed (RLS/permission issue?), returning empty:",
      internshipsError.message
    );
  }

  const internshipIds = internships?.map(i => i.id) || [];
  const activeInternships = internships?.filter(i => i.status !== "archived" && i.status !== "closed") || [];
  const archivedInternships = internships?.filter(i => i.status === "archived" || i.status === "closed") || [];

  // 3. Parallel fetch: applications + requirements (both depend only on internshipIds)
  let applications: Application[] = [];
  let requirements: Requirement[] = [];
  if (internshipIds.length > 0) {
    const [appsResult, reqsResult] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .in("internship_id", internshipIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("requirements")
        .select("*")
        .in("internship_id", internshipIds),
    ]);
    if (appsResult.error) {
      console.warn("[getDashboardAnalytics] applications query failed:", appsResult.error.message);
    }
    if (appsResult.data) applications = appsResult.data as Application[];
    if (reqsResult.error) {
      console.warn("[getDashboardAnalytics] requirements query failed:", reqsResult.error.message);
    }
    if (reqsResult.data) requirements = reqsResult.data as Requirement[];
  }

  // 4. Parallel fetch: AI analyses + interview count (both depend on appIds)
  const appIds = applications.map(a => a.id);
  let analyses: CandidateAiAnalysis[] = [];
  let scheduledInterviews = 0;
  if (appIds.length > 0) {
    const [aisResult, interviewsResult] = await Promise.all([
      supabase
        .from("candidate_ai_analysis")
        .select("*")
        .in("application_id", appIds),
      supabase
        .from("interviews")
        .select("*", { count: "exact", head: true })
        .in("application_id", appIds)
        .in("status", ["scheduled", "completed", "offer_sent"]),
    ]);
    if (aisResult.error) {
      console.warn("[getDashboardAnalytics] candidate_ai_analysis query failed:", aisResult.error.message);
    }
    if (aisResult.data) analyses = aisResult.data as CandidateAiAnalysis[];
    if (!interviewsResult.error && interviewsResult.count) scheduledInterviews = interviewsResult.count;
  }

  // Calculate Stats
  let totalScore = 0;
  let excellent = 0, good = 0, average = 0, weak = 0;

  analyses.forEach(a => {
    totalScore += a.match_score;
    if (a.match_score >= 85) excellent++;
    else if (a.match_score >= 70) good++;
    else if (a.match_score >= 50) average++;
    else weak++;
  });

  const avgAiScore = analyses.length > 0 ? Math.round(totalScore / analyses.length) : 0;

  // Weekly trend: count apps in last 7 days vs previous 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeekApps = applications.filter(a => new Date(a.created_at) >= sevenDaysAgo).length;
  const lastWeekApps = applications.filter(a => new Date(a.created_at) >= fourteenDaysAgo && new Date(a.created_at) < sevenDaysAgo).length;
  const weeklyApplicationTrend = lastWeekApps === 0
    ? (thisWeekApps > 0 ? 100 : null)
    : Math.round(((thisWeekApps - lastWeekApps) / lastWeekApps) * 100);

  // Weekly chart series — real application counts bucketed into the last 7
  // 7-day windows (oldest → newest), replacing the previously hardcoded graph.
  const weeklyApplications: { name: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const windowStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count = applications.filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t >= windowStart.getTime() && t < windowEnd.getTime();
    }).length;
    weeklyApplications.push({
      name: windowStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    });
  }

  // AI scores by internship (for stable sorting instead of Math.random)
  const aiScoresByInternship: Record<string, number> = {};
  if (internships) {
    internships.forEach(internship => {
      const internshipApps = applications.filter(a => a.internship_id === internship.id);
      const internshipAnalyses = analyses.filter(an => internshipApps.some(a => a.id === an.application_id));
      if (internshipAnalyses.length > 0) {
        const sum = internshipAnalyses.reduce((acc, a) => acc + a.match_score, 0);
        aiScoresByInternship[internship.id] = Math.round(sum / internshipAnalyses.length);
      } else {
        aiScoresByInternship[internship.id] = 0;
      }
    });
  }

  const stats: DashboardStats = {
    totalInternships: internships?.length || 0,
    activeInternships: activeInternships.length,
    archivedInternships: archivedInternships.length,
    totalApplications: applications.length,
    newApplications: applications.filter(a => a.status === "new").length,
    underReviewApplications: applications.filter(a => a.status === "under_review").length,
    shortlistedApplications: applications.filter(a => a.status === "shortlisted").length,
    rejectedApplications: applications.filter(a => a.status === "rejected").length,
    scheduledInterviews,
    averageAiScore: avgAiScore,
    weeklyApplicationTrend,
    aiScoresByInternship,
    scoreDistribution: { excellent, good, average, weak }
  };

  // Top Universities — single pass over applications (O(A)) instead of the
  // previous per-university filter scans (O(U × A)). The scoredCount tracks
  // applications that have an AI analysis, matching the old denominator exactly.
  const analysisByApp = new Map(analyses.map(a => [a.application_id, a]));
  const uniMap = new Map<string, { count: number, totalScore: number, scoredCount: number }>();
  applications.forEach(app => {
    const uni = app.university || "Unknown";
    const analysis = analysisByApp.get(app.id);
    const score = analysis?.match_score || 0;

    if (!uniMap.has(uni)) uniMap.set(uni, { count: 0, totalScore: 0, scoredCount: 0 });
    const current = uniMap.get(uni)!;
    current.count++;
    if (analysis) current.scoredCount++;
    if (score > 0) {
      current.totalScore += score;
    }
  });

  const topUniversities = Array.from(uniMap.entries())
    .map(([university, data]) => ({
      university,
      applicants: data.count,
      avgScore: data.totalScore > 0 ? Math.round(data.totalScore / (data.scoredCount || 1)) : 0
    }))
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 5);

  // Top Skills
  const skillMap = new Map<string, number>();
  requirements.forEach(req => {
    const skill = req.requirement.trim();
    skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
  });
  
  const topSkills = Array.from(skillMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Recent Activity
  const recentActivity: ActivityItem[] = [];
  
  // Add recent applications
  applications.slice(0, 10).forEach(app => {
    const internship = internships?.find(i => i.id === app.internship_id);
    recentActivity.push({
      id: `app-${app.id}`,
      type: "application",
      title: "New Application Received",
      description: `${app.applicant_name} applied for ${internship?.title || "a role"}`,
      timestamp: app.created_at,
      link: `/dashboard/applications/${app.internship_id}/${app.id}`
    });
  });

  // Add recent AI analyses
  analyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10).forEach(analysis => {
      const app = applications.find(a => a.id === analysis.application_id);
      if (app) {
        recentActivity.push({
          id: `ai-${analysis.id}`,
          type: "ai_analysis",
          title: "AI Analysis Completed",
          description: `Score: ${analysis.match_score}% for ${app.applicant_name}`,
          timestamp: analysis.created_at,
          link: `/dashboard/applications/${app.internship_id}/${app.id}`
        });
      }
    });

  // Sort and limit activity
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Applications per internship — derived from the applications already fetched
  // for this org (exact count, same source rows as getApplicationsCountByInternship).
  const applicationsCountByInternship: Record<string, number> = {};
  if (internships) {
    internships.forEach(i => { applicationsCountByInternship[i.id] = 0; });
  }
  applications.forEach(app => {
    applicationsCountByInternship[app.internship_id] = (applicationsCountByInternship[app.internship_id] || 0) + 1;
  });

  return {
    stats,
    topUniversities,
    topSkills,
    recentActivity: recentActivity.slice(0, 10),
    internships: (internships as Internship[]) ?? [],
    applicationsCountByInternship,
    weeklyApplications,
    orgResolved: true,
  };
}
