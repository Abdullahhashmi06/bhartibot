import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/applicant/cv-optimizations/[id]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("cv_analyses")
    .select("*")
    .eq("id", params.id)
    .eq("applicant_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Analysis not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

/**
 * PATCH /api/applicant/cv-optimizations/[id]
 * Updates suggestions state, user edits, or creates a new draft version.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updateFields: any = {
    updated_at: new Date().toISOString(),
  };

  if (body.suggestions !== undefined) updateFields.suggestions = body.suggestions;
  if (body.optimized_content !== undefined) updateFields.optimized_content = body.optimized_content;
  if (body.version !== undefined) updateFields.version = body.version;
  if (body.match_score !== undefined) updateFields.match_score = body.match_score;
  if (body.summary !== undefined) updateFields.summary = body.summary;

  const { data, error } = await supabase
    .from("cv_analyses")
    .update(updateFields)
    .eq("id", params.id)
    .eq("applicant_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update draft: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

/**
 * DELETE /api/applicant/cv-optimizations/[id]
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("cv_analyses")
    .delete()
    .eq("id", params.id)
    .eq("applicant_id", user.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete draft: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
