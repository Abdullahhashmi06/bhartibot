import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApplicationsByIds, getApplicationAnswersForApplications } from "@/lib/queries/applications";
import { getCandidateAiAnalyses } from "@/lib/queries/ai-analysis";
import type { CandidateAiAnalysis } from "@/lib/types";
import Shell from "@/components/layout/Shell";
import ComparisonView from "@/components/comparison/ComparisonView";

export default async function ComparePage({
  searchParams
}: {
  searchParams: { ids?: string }
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const idsParam = searchParams.ids;
  if (!idsParam) {
    return (
      <Shell userEmail={user.email || ""}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-text-secondary">No candidates selected for comparison.</p>
        </div>
      </Shell>
    );
  }

  const ids = idsParam.split(',').filter(Boolean).slice(0, 4); // Max 4
  
  if (ids.length < 2) {
    return (
      <Shell userEmail={user.email || ""}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-text-secondary">Please select at least 2 candidates to compare.</p>
        </div>
      </Shell>
    );
  }

  // Fetch all applications by IDs (handles efficiently with a single query)
  const candidates = await getApplicationsByIds(supabase, ids);

  if (candidates.length < 2) {
    return (
      <Shell userEmail={user.email || ""}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-text-secondary">Some candidates could not be found. Please try again.</p>
        </div>
      </Shell>
    );
  }

  // Fetch analyses and answers for ALL candidates with two batched queries
  // (previously one round-trip pair per candidate). Failures degrade to the
  // same null/[] defaults as before.
  const [analysisRows, answersByApplication] = await Promise.all([
    getCandidateAiAnalyses(supabase, ids),
    getApplicationAnswersForApplications(supabase, ids),
  ]);

  const analyses: Record<string, CandidateAiAnalysis | null> = {};
  analysisRows.forEach((analysis) => {
    analyses[analysis.application_id] = analysis;
  });

  // Ensure every candidate has at least null/[] entries
  const answers: Record<string, { question: string; answer: string }[]> = {};
  candidates.forEach((c) => {
    if (!(c.id in analyses)) {
      analyses[c.id] = null;
    }
    answers[c.id] = answersByApplication[c.id] || [];
  });

  return (
    <Shell userEmail={user.email || ""}>
      <ComparisonView 
        candidates={candidates} 
        analyses={analyses} 
        answers={answers} 
      />
    </Shell>
  );
}
