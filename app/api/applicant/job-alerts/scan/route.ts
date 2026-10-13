import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanAndNotifyApplicantAlerts } from "@/lib/queries/job-alerts";
import type { ApplicantFeedItem } from "@/lib/types";

/**
 * POST /api/applicant/job-alerts/scan
 * Runs matching on all active alerts against published internships.
 * Inserts in-app notifications and returns newly found matches.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch published internships
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
    console.warn("[JOB_ALERTS_SCAN] feed fetch warning:", err);
  }

  const result = await scanAndNotifyApplicantAlerts(supabase, user.id, jobs);

  return NextResponse.json({
    success: true,
    newMatchesCount: result.newMatchesCount,
    matches: result.matches,
  });
}
