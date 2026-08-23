import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Star,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import { getRecruiterInternships } from "@/lib/queries/internships";
import ShortlistedCandidatesClient from "./ShortlistedCandidatesClient";

export const dynamic = "force-dynamic";

export default async function ShortlistedCandidatesPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/login");

  const internships = await getRecruiterInternships(supabase);
  const internshipIds = internships.map((i) => i.id);

  if (internshipIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-white dark:bg-slate-800 py-20 px-6 text-center shadow-subtle">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-light text-teal border border-teal/20">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primary dark:text-white">
              No Internships Yet
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Create an internship first, then you can shortlist candidates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  let shortlistedCandidates: any[] = [];

  if (internshipIds.length > 0) {
    const { data, error } = await supabase
      .from("applications")
      .select("*, internships!inner(*), candidate_ai_analysis(match_score, recommendation, strengths, weaknesses, missing_skills)")
      .in("internship_id", internshipIds)
      .eq("status", "shortlisted")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[ShortlistedPage] AI join failed, falling back:", error.message);
      const { data: plain, error: plainError } = await supabase
        .from("applications")
        .select("*, internships!inner(*)")
        .in("internship_id", internshipIds)
        .eq("status", "shortlisted")
        .order("created_at", { ascending: false });
      if (!plainError && plain) {
        shortlistedCandidates = plain.map((row: any) => ({
          ...row,
          match_score: null,
          recommendation: null,
        }));
      }
    } else if (data) {
      shortlistedCandidates = data.map((row: any) => {
        const analysis = row.candidate_ai_analysis?.[0];
        return {
          ...row,
          match_score: analysis?.match_score ?? null,
          recommendation: analysis?.recommendation ?? null,
        };
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border dark:border-slate-700 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal-dark border border-teal/20 dark:bg-teal/20">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-3xl text-primary dark:text-white tracking-tight">
                Shortlisted Candidates
              </h1>
              <p className="text-sm text-text-secondary dark:text-slate-400 mt-0.5">
                Candidates you&apos;ve shortlisted across all internships. Schedule interviews or take further action.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-teal-light dark:bg-teal/20 px-4 py-2 rounded-xl border border-teal/20">
          <Sparkles className="h-4 w-4 text-teal-dark dark:text-teal" />
          <span className="font-mono text-sm font-bold text-teal-dark dark:text-teal">
            {shortlistedCandidates.length} shortlisted
          </span>
        </div>
      </div>

      <ShortlistedCandidatesClient
        candidates={shortlistedCandidates}
        recruiterId={headerUser.id}
      />
    </div>
  );
}
