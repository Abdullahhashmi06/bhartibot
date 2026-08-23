import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardAnalytics } from "@/lib/queries/dashboard";

/**
 * GET /api/data/recruiter-dashboard
 * Returns all recruiter dashboard data for client-side caching.
 * Authenticated via cookies — same RLS as the server component.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = await getDashboardAnalytics(supabase);
  const fullName = (user.user_metadata?.full_name as string) || null;
  const orgName = (user.user_metadata?.organization_name as string) || null;
  return NextResponse.json({ ...data, userName: fullName || orgName });
}
