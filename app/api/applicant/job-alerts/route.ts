import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getApplicantJobAlerts,
  createJobAlert,
} from "@/lib/queries/job-alerts";
import type { CreateJobAlertInput } from "@/lib/types";

/**
 * GET /api/applicant/job-alerts
 * Returns all saved alerts for the authenticated applicant.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await getApplicantJobAlerts(supabase, user.id);
  return NextResponse.json({ success: true, data: alerts });
}

/**
 * POST /api/applicant/job-alerts
 * Creates a new job alert.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateJobAlertInput;

  if (!body.title || !body.title.trim()) {
    return NextResponse.json(
      { success: false, error: "Alert title is required." },
      { status: 400 }
    );
  }

  try {
    const alert = await createJobAlert(supabase, user.id, body);
    return NextResponse.json({ success: true, data: alert });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create job alert: " + err.message },
      { status: 500 }
    );
  }
}
