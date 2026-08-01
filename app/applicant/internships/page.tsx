import { createClient } from "@/lib/supabase/server";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";
import InternshipExplorer from "@/components/applicant/InternshipExplorer";

export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // AI recommendation engine v2 — configurable weights, acceptance
  // probability, cached + batched AI explanations, one feed RPC.
  const { recommendations, savedJobIds, appliedJobIds } =
    await getApplicantRecommendations(supabase, user.id, user.email || "");

  // Split into "Recommended For You" (strong overall fit, acceptance-aware)
  // vs "Other Opportunities". The engine already sorts by overallScore.
  const RECOMMENDED_THRESHOLD = 55;

  const recommended = recommendations.filter(
    (r) => r.overallScore >= RECOMMENDED_THRESHOLD && r.matchScore >= 45
  );

  const others = recommendations.filter(
    (r) => !(r.overallScore >= RECOMMENDED_THRESHOLD && r.matchScore >= 45)
  );

  return (
    <InternshipExplorer
      recommended={recommended}
      others={others}
      savedJobIds={savedJobIds}
      appliedJobIds={appliedJobIds}
      hasProfileSignal={recommendations.some(
        (r) => r.matchedSkills.length > 0 || r.profileCompleteness >= 40
      )}
      totalCount={recommendations.length}
    />
  );
}
