import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getApplicantProfile,
  getApplicantApplications,
  getSavedJobs,
  getApplicantSkills,
  getApplicantProjects,
  getApplicantExperience,
  getProfileCompletionScore,
} from "@/lib/queries/applicant";
import { getApplicantInterviews } from "@/lib/queries/interview";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";

/** Deterministic AI-insights computation from the recommendation feed. */
function buildInsights(recommendations: any[]) {
  const hasSignal = recommendations.some(
    (r) => r.matchedSkills?.length > 0 || r.profileCompleteness >= 40
  );
  if (!hasSignal || recommendations.length === 0) {
    return { topFields: "", topGapSkill: null, gapBoost: null, bestWorkMode: null, strengths: [], hasSignal: false };
  }

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

  const gapAgg = new Map<string, { gain: number; count: number }>();
  recommendations.forEach((r) => {
    (r.skillGaps || []).forEach((g: any) => {
      const cur = gapAgg.get(g.skill) ?? { gain: 0, count: 0 };
      cur.gain += g.matchGain;
      cur.count += 1;
      gapAgg.set(g.skill, cur);
    });
  });
  const topGap = Array.from(gapAgg.entries())
    .map(([skill, v]) => ({ skill, avgGain: v.gain / v.count }))
    .sort((a, b) => b.avgGain - a.avgGain)[0];

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

  const skillCount = new Map<string, number>();
  recommendations.forEach((r) => {
    (r.matchedSkills || []).forEach((s: string) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1));
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

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = user.id;
  const userEmail = user.email || "";

  const [
    { data: profile },
    { data: applications },
    { data: savedJobs },
    { data: skills },
    { data: projects },
    { data: experience },
    { data: interviews },
    engine,
  ] = await Promise.all([
    getApplicantProfile(supabase, userId),
    getApplicantApplications(supabase, userEmail),
    getSavedJobs(supabase, userId),
    getApplicantSkills(supabase, userId),
    getApplicantProjects(supabase, userId),
    getApplicantExperience(supabase, userId),
    getApplicantInterviews(supabase, userEmail),
    getApplicantRecommendations(supabase, userId, userEmail),
  ]);

  const { recommendations, savedJobIds, appliedJobIds } = engine;

  const profileComplete = getProfileCompletionScore(
    profile,
    skills || [],
    projects || [],
    experience || []
  );

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

  return NextResponse.json({
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
    userId,
    userEmail,
    underReview: applications?.filter((a: any) => ["under_review", "ai_reviewed", "viewed"].includes(a.status)).length || 0,
  });
}
