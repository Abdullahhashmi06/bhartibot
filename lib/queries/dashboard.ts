import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardStats, ActivityItem, Internship, Application, CandidateAiAnalysis, Requirement } from "@/lib/types";

export async function getDashboardAnalytics(supabase: SupabaseClient): Promise<{
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  topUniversities: { university: string; applicants: number; avgScore: number }[];
  topSkills: { skill: string; count: number }[];
}> {
  // 1. Get all internships for the organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile) throw new Error("Profile not found");

  const orgId = profile.organization_id;

  const { data: internships } = await supabase
    .from("internships")
    .select("*")
    .eq("organization_id", orgId) as { data: Internship[] | null };

  const activeInternships = internships?.filter(i => i.status !== "archived" && i.status !== "closed") || [];
  const archivedInternships = internships?.filter(i => i.status === "archived" || i.status === "closed") || [];

  const internshipIds = internships?.map(i => i.id) || [];

  // 2. Get applications for these internships
  let applications: Application[] = [];
  if (internshipIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .in("internship_id", internshipIds)
      .order("created_at", { ascending: false });
    if (apps) applications = apps as Application[];
  }

  // 3. Get AI Analysis for these applications
  const appIds = applications.map(a => a.id);
  let analyses: CandidateAiAnalysis[] = [];
  if (appIds.length > 0) {
    const { data: ais } = await supabase
      .from("candidate_ai_analysis")
      .select("*")
      .in("application_id", appIds);
    if (ais) analyses = ais as CandidateAiAnalysis[];
  }

  // 4. Get requirements for top skills
  let requirements: Requirement[] = [];
  if (internshipIds.length > 0) {
    const { data: reqs } = await supabase
      .from("requirements")
      .select("*")
      .in("internship_id", internshipIds);
    if (reqs) requirements = reqs as Requirement[];
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
    averageAiScore: avgAiScore,
    weeklyApplicationTrend,
    aiScoresByInternship,
    scoreDistribution: { excellent, good, average, weak }
  };

  // Top Universities
  const uniMap = new Map<string, { count: number, totalScore: number }>();
  applications.forEach(app => {
    const uni = app.university || "Unknown";
    const analysis = analyses.find(a => a.application_id === app.id);
    const score = analysis?.match_score || 0;
    
    if (!uniMap.has(uni)) uniMap.set(uni, { count: 0, totalScore: 0 });
    const current = uniMap.get(uni)!;
    current.count++;
    if (score > 0) {
      current.totalScore += score;
    }
  });

  const topUniversities = Array.from(uniMap.entries())
    .map(([university, data]) => ({
      university,
      applicants: data.count,
      avgScore: data.totalScore > 0 ? Math.round(data.totalScore / applications.filter(a => a.university === university && analyses.some(an => an.application_id === a.id)).length || 1) : 0
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
  
  return {
    stats,
    topUniversities,
    topSkills,
    recentActivity: recentActivity.slice(0, 10)
  };
}
