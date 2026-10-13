import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, Target } from "lucide-react";
import { getUserFromHeaders, createClient } from "@/lib/supabase/server";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";

export const dynamic = "force-dynamic";

export default async function ApplicantRoadmapPage() {
  const user = getUserFromHeaders();
  if (!user) redirect("/applicant-auth");
  const { recommendations } = await getApplicantRecommendations(createClient(), user.id, user.email);
  const priorities = new Map<string, { score: number; roles: Set<string>; priority: string }>();
  for (const job of recommendations) {
    for (const gap of job.skillGaps) {
      const key = gap.skill.toLowerCase();
      const entry = priorities.get(key) ?? { score: 0, roles: new Set<string>(), priority: gap.priority };
      entry.score += gap.matchGain;
      entry.roles.add(job.title);
      priorities.set(key, entry);
    }
  }
  const steps = Array.from(priorities.entries()).map(([key, value]) => ({ skill: recommendations.flatMap((job) => job.skillGaps).find((gap) => gap.skill.toLowerCase() === key)?.skill ?? key, ...value })).sort((a, b) => b.score - a.score).slice(0, 8);

  return <div className="mx-auto max-w-4xl space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-wide text-teal">Learn toward your matches</p><h1 className="mt-1 text-2xl font-bold text-primary dark:text-white">Your course roadmap</h1><p className="mt-1 text-sm text-text-secondary">A learning plan built from skill gaps in your recommended internships.</p></header>
    {!steps.length ? <section className="rounded-2xl border border-border bg-white p-6 dark:bg-slate-800"><CheckCircle2 className="h-6 w-6 text-teal"/><h2 className="mt-2 font-semibold text-primary dark:text-white">No skill gaps yet</h2><p className="mt-1 text-sm text-text-secondary">Add skills and projects to your profile, then explore jobs to build a personalized roadmap.</p><Link href="/applicant/profile" className="mt-3 inline-block text-sm font-medium text-teal">Update profile →</Link></section> : <ol className="space-y-3">{steps.map((step, index) => <li key={step.skill} className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-800"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-primary dark:text-white">Learn {step.skill}</h2><span className="inline-flex items-center gap-1 text-xs text-teal"><Target className="h-3.5 w-3.5"/>+{Math.round(step.score / step.roles.size)}% average match</span></div><p className="mt-1 text-xs text-text-secondary">Requested in {step.roles.size} recommended {step.roles.size === 1 ? "role" : "roles"}: {Array.from(step.roles).slice(0, 3).join(", " )}</p><a className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-primary hover:border-teal dark:text-white" target="_blank" rel="noreferrer" href={`https://www.coursera.org/search?query=${encodeURIComponent(step.skill)}`}><BookOpen className="h-3.5 w-3.5"/>Find courses</a></div></div></li>)}</ol>}
  </div>;
}
