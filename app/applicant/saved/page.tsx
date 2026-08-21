import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import SavedJobCard from "@/components/applicant/SavedJobCard";

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) return null;

  // Engine-driven — saved jobs are enriched with real match/acceptance data.
  const { recommendations, savedJobIds } = await getApplicantRecommendations(
    supabase,
    headerUser.id,
    headerUser.email
  );

  const savedJobs = recommendations.filter((r) => savedJobIds.includes(r.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary dark:text-white">
          Saved Jobs
        </h1>
        <p className="text-text-secondary mt-1">
          Internships you&apos;ve bookmarked for later — ranked by your match and
          acceptance chance.
        </p>
      </div>

      {savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedJobs.map((job) => (
            <SavedJobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center shadow-card border border-border flex flex-col items-center">
          <div className="w-16 h-16 bg-teal-light dark:bg-teal/15 text-teal-dark dark:text-teal rounded-full flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-2">
            No Saved Jobs
          </h2>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            You haven&apos;t saved any internships yet. Browse available positions
            and bookmark ones you&apos;re interested in!
          </p>
          <Link href="/applicant/internships">
            <Button variant="gradient">Explore Internships</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
