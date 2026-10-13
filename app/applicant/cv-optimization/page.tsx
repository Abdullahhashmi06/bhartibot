import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import { getApplicantProfile } from "@/lib/queries/applicant";
import CvOptimizationClient from "@/components/applicant/CvOptimizationClient";
import type { ApplicantFeedItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CvOptimizationPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();

  if (!headerUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary">Please sign in to access CV Optimization.</p>
      </div>
    );
  }

  // 1. Fetch applicant profile to check CV upload status
  const { data: profile } = await getApplicantProfile(supabase, headerUser.id);

  // 2. Fetch published internships for convenient dropdown targeting
  let jobs: ApplicantFeedItem[] = [];
  try {
    const { data: feedData, error } = await supabase.rpc("get_applicant_feed");
    if (!error && Array.isArray(feedData)) {
      jobs = feedData as ApplicantFeedItem[];
    } else {
      // Fallback direct query if RPC is not present
      const { data: fallbackInternships } = await supabase
        .from("internships")
        .select("id, title, description, location, work_mode, duration, stipend, status, public_slug, organisations(name)")
        .eq("status", "published")
        .limit(20);

      if (fallbackInternships) {
        jobs = fallbackInternships.map((f: any) => ({
          id: f.id,
          organization_id: "",
          title: f.title,
          field: null,
          description: f.description,
          location: f.location,
          work_mode: f.work_mode,
          duration: f.duration,
          stipend: f.stipend,
          internship_type: "full_time",
          deadline: null,
          status: f.status,
          public_slug: f.public_slug,
          company_name: f.organisations?.name || "Company",
          required_skills: [],
          preferred_skills: [],
          applicant_count: 0,
          avg_applicant_match: null,
          created_at: new Date().toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn("[CV-OPTIMIZATION] feed fetch warning:", err);
  }

  return (
    <CvOptimizationClient
      hasCv={Boolean(profile?.cv_path)}
      cvPath={profile?.cv_path}
      jobs={jobs}
    />
  );
}
