import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApplicationsWithScores, getOrgApplicationStats } from "@/lib/queries/applications";
import { getRecruiterInternships } from "@/lib/queries/internships";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const internshipId = searchParams.get("internshipId");

  if (internshipId) {
    // Fetch applications for a specific internship
    const applications = await getApplicationsWithScores(supabase, internshipId);
    return NextResponse.json({ applications });
  }

  // Fetch all internships with counts
  const internships = await getRecruiterInternships(supabase);
  const internshipIds = internships.map((i) => i.id);
  const stats = await getOrgApplicationStats(supabase, internshipIds);

  return NextResponse.json({ internships, stats });
}
