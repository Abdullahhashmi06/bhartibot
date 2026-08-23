import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getApplicantProfile,
  getApplicantSkills,
  getApplicantProjects,
  getApplicantExperience,
} from "@/lib/queries/applicant";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [{ data: profile }, { data: skills }, { data: projects }, { data: experience }] =
    await Promise.all([
      getApplicantProfile(supabase, user.id),
      getApplicantSkills(supabase, user.id),
      getApplicantProjects(supabase, user.id),
      getApplicantExperience(supabase, user.id),
    ]);

  return NextResponse.json({ profile, skills, projects, experience });
}
