import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApplicationsByIds, getApplicationAnswers } from "@/lib/queries/applications";
import { getCandidateAiAnalysis } from "@/lib/queries/ai-analysis";
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

  // Fetch analyses and answers for each candidate in parallel with graceful error handling
  const analyses: Record<string, CandidateAiAnalysis | null> = {};
  const answers: Record<string, { question: string; answer: string }[]> = {};

  const results = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const [analysis, candidateAnswers] = await Promise.all([
        getCandidateAiAnalysis(supabase, candidate.id),
        getApplicationAnswers(supabase, candidate.id),
      ]);
      return { candidateId: candidate.id, analysis, answers: candidateAnswers };
    })
  );

  // Build lookup maps from settled results, defaulting to null/[] on failure
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const { candidateId, analysis, answers: candidateAnswers } = result.value;
      analyses[candidateId] = analysis || null;
      answers[candidateId] = candidateAnswers || [];
    }
  });

  // Ensure every candidate has at least null/[] entries even if fetch failed
  candidates.forEach((c) => {
    if (!(c.id in analyses)) {
      analyses[c.id] = null;
      answers[c.id] = [];
    }
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
