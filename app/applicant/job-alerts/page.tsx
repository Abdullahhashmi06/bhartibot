import { redirect } from "next/navigation";
import { getUserFromHeaders, createClient } from "@/lib/supabase/server";
import { getApplicantJobAlerts } from "@/lib/queries/job-alerts";
import JobAlertsClient from "./JobAlertsClient";
import type { ApplicantFeedItem, JobAlert } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobAlertsPage() {
  const user = getUserFromHeaders();
  if (!user) redirect("/applicant-auth");

  const supabase = createClient();

  // 1. Fetch saved job alerts
  const alerts: JobAlert[] = await getApplicantJobAlerts(supabase, user.id);

  // 2. Fetch published internships
  let jobs: ApplicantFeedItem[] = [];
  try {
    const { data: feedData, error } = await supabase.rpc("get_applicant_feed");
    if (!error && Array.isArray(feedData)) {
      jobs = feedData as ApplicantFeedItem[];
    } else {
      const { data: fallbackInternships } = await supabase
        .from("internships")
        .select("id, title, description, location, work_mode, duration, stipend, status, public_slug, organisations(name)")
        .eq("status", "published")
        .limit(50);

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
    console.warn("[JOB_ALERTS_PAGE] feed warning:", err);
  }

  return <JobAlertsClient initialAlerts={alerts} jobs={jobs} />;
}
