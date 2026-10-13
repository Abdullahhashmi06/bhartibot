import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateJobAlert, deleteJobAlert } from "@/lib/queries/job-alerts";

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/applicant/job-alerts/[id]
 * Updates criteria or toggles is_active state.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const updated = await updateJobAlert(supabase, params.id, user.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update alert: " + err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applicant/job-alerts/[id]
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteJobAlert(supabase, params.id, user.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete alert: " + err.message },
      { status: 500 }
    );
  }
}
