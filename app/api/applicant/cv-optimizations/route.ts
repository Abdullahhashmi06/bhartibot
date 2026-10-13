import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CvOptimizationAnalysis } from "@/lib/types";

/**
 * GET /api/applicant/cv-optimizations
 * Returns saved optimization sessions for the authenticated applicant.
 */
export async function GET() {
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
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // If table doesn't exist yet, return empty list gracefully
    console.warn("[CV-OPTIMIZATIONS] Table fetch warning:", error.message);
    return NextResponse.json({ success: true, data: [] });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

/**
 * POST /api/applicant/cv-optimizations
 * Saves a new CV optimization session or version.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CvOptimizationAnalysis;

  if (!body.target_role_title) {
    return NextResponse.json(
      { success: false, error: "Target role title is required." },
      { status: 400 }
    );
  }

  const insertPayload = {
    applicant_id: user.id,
    original_cv_path: body.original_cv_path || null,
    target_job_id: body.target_job_id || null,
    target_role_title: body.target_role_title,
    target_role_description: body.target_role_description || "",
    version: body.version || 1,
    match_score: body.match_score || 0,
    summary: body.summary || "",
    strengths: body.strengths || [],
    missing_evidence: body.missing_evidence || [],
    keyword_analysis: body.keyword_analysis || { matchedKeywords: [], missingKeywords: [] },
    suggestions: body.suggestions || [],
    optimized_content: body.optimized_content || {},
    model_version: body.model_version || "gemini-1.5-flash",
  };

  const { data, error } = await supabase
    .from("cv_analyses")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("[CV-OPTIMIZATIONS] insert error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to persist optimization draft: " + error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
