import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApplicantApplications } from "@/lib/queries/applicant";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: applications } = await getApplicantApplications(supabase, user.email || "");
  return NextResponse.json({ applications });
}
