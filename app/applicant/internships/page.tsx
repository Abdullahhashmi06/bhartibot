import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";
import InternshipExplorer from "@/components/applicant/InternshipExplorer";
import type { ApplicantFeedItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) return null;

  // AI recommendation engine v2 — configurable weights, acceptance
  // probability, cached + batched AI explanations, one feed RPC.
  const { recommendations, savedJobIds, appliedJobIds } =
    await getApplicantRecommendations(supabase, headerUser.id, headerUser.email);

  // Recently-expired internships (deadline passed within the last 15 days).
  // Shown under a separate "Deadline Passed" filter — applicants can browse
  // but can no longer apply.
  const { data: expiredFeed } = await supabase.rpc(
    "get_expired_applicant_feed"
  );
  const expired: ApplicantFeedItem[] = (expiredFeed ?? []) as ApplicantFeedItem[];

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
      expired={expired}
      savedJobIds={savedJobIds}
      appliedJobIds={appliedJobIds}
      hasProfileSignal={recommendations.some(
        (r) => r.matchedSkills.length > 0 || r.profileCompleteness >= 40
      )}
      totalCount={recommendations.length}
    />
  );
}
