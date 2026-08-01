import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { incrementShareViewCount } from "@/lib/queries/share";
import { getCvSignedUrl } from "@/lib/queries/storage";
import { timingSafeEqual, scryptSync } from "crypto";
import type { SharedReviewData, ShareToken, ParsedResume, InterviewQuestion } from "@/lib/types";

/**
 * Validates a password against a stored hash using constant-time comparison.
 */
function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(derivedKey), Buffer.from(key));
}
/**
 * GET /api/share/review/[token]
 * Returns the shared review data for a valid token.
 * If password-protected, returns { passwordRequired: true } without data.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();
    const { token } = params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid share token." },
        { status: 400 }
      );
    }

    // Fetch the share token
    const { data: shareToken, error: tokenError } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (tokenError || !shareToken) {
      return NextResponse.json(
        { error: "This shared review is no longer available." },
        { status: 404 }
      );
    }

    const st = shareToken as ShareToken;

    // Check revocation
    if (st.is_revoked) {
      return NextResponse.json(
        { error: "This shared review is no longer available." },
        { status: 410 }
      );
    }

    // Check expiration
    if (st.expires_at && new Date(st.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This shared review has expired." },
        { status: 410 }
      );
    }

    // If password-protected, don't return data yet
    if (st.password_hash) {
      return NextResponse.json({ passwordRequired: true });
    }

    // Fetch the full review data
    const reviewData = await fetchSharedReviewData(supabase, st);

    // Increment view count asynchronously (don't block the response)
    incrementShareViewCount(supabase, st.id).catch(console.error);

    return NextResponse.json(reviewData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Share API] GET error:", message);
    return NextResponse.json(
      { error: "Failed to load shared review." },
      { status: 500 }
    );
  }
}
/**
 * POST /api/share/review/[token]
 * Verifies password and returns the shared review data.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();
    const { token } = params;
    const { password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid share token." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    // Fetch the share token
    const { data: shareToken, error: tokenError } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (tokenError || !shareToken) {
      return NextResponse.json(
        { error: "This shared review is no longer available." },
        { status: 404 }
      );
    }

    const st = shareToken as ShareToken;

    // Check revocation
    if (st.is_revoked) {
      return NextResponse.json(
        { error: "This shared review is no longer available." },
        { status: 410 }
      );
    }

    // Check expiration
    if (st.expires_at && new Date(st.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This shared review has expired." },
        { status: 410 }
      );
    }

    // Verify password
    if (!st.password_hash || !verifyPassword(password, st.password_hash)) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    // Fetch the full review data
    const reviewData = await fetchSharedReviewData(supabase, st);

    // Increment view count
    incrementShareViewCount(supabase, st.id).catch(console.error);

    return NextResponse.json(reviewData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Share API] POST error:", message);
    return NextResponse.json(
      { error: "Failed to load shared review." },
      { status: 500 }
    );
  }
}

/**
 * Fetches all necessary data for a shared review.
 */
async function fetchSharedReviewData(
  supabase: ReturnType<typeof createAdminClient>,
  shareToken: ShareToken
): Promise<SharedReviewData> {
  const [applicationResult, analysisResult, orgResult, internshipResult] =
    await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("id", shareToken.application_id)
        .single(),
      supabase
        .from("candidate_ai_analysis")
        .select("*")
        .eq("application_id", shareToken.application_id)
        .maybeSingle(),
      supabase
        .from("organisations")
        .select("name")
        .eq("id", shareToken.organization_id)
        .single(),
      supabase
        .from("internships")
        .select("title, field")
        .eq("organization_id", shareToken.organization_id)
        .maybeSingle(),
    ]);

  const application = applicationResult.data;
  const analysis = analysisResult.data;
  const org = orgResult.data;
  const internship = internshipResult.data;

  // Get CV signed URL if included
  let cvUrl: string | null = null;
  if (shareToken.include_resume && application?.cv_path) {
    try {
      cvUrl = await getCvSignedUrl(supabase as any, application.cv_path);
    } catch {
      // CV not available
    }
  }

  // Get recruiter notes if included
  let recruiterNotes: string | null = null;
  if (shareToken.include_notes) {
    const { data: notesData } = await supabase
      .from("recruiter_notes")
      .select("notes")
      .eq("application_id", shareToken.application_id)
      .maybeSingle();
    recruiterNotes = notesData?.notes ?? null;
  }

  // If the internship was deleted, try to find it by application
  let internshipTitle = internship?.title ?? "Unknown Position";
  let internshipField = internship?.field ?? null;

  if (!internship && application?.internship_id) {
    const { data: fallbackInternship } = await supabase
      .from("internships")
      .select("title, field")
      .eq("id", application.internship_id)
      .maybeSingle();
    if (fallbackInternship) {
      internshipTitle = fallbackInternship.title;
      internshipField = fallbackInternship.field;
    }
  }

  return {
    token: shareToken.token,
    applicant_name: application?.applicant_name ?? "Unknown Candidate",
    email: application?.email ?? "",
    phone: application?.phone ?? null,
    university: application?.university ?? null,
    degree: application?.degree ?? null,
    internship_title: internshipTitle,
    internship_field: internshipField,
    organization_name: org?.name ?? "Unknown Organization",
    match_score: analysis?.match_score ?? null,
    strengths: analysis?.strengths ?? [],
    weaknesses: analysis?.weaknesses ?? [],
    missing_skills: analysis?.missing_skills ?? [],
    recommendation: analysis?.recommendation ?? null,
    reasoning: analysis?.reasoning ?? null,
    parsed_resume: (analysis?.parsed_resume as ParsedResume) ?? null,
    interview_questions: (analysis?.interview_questions as InterviewQuestion[]) ?? null,
    recruiter_notes: recruiterNotes,
    cv_url: cvUrl,
    shared_sections: shareToken.shared_sections as any[],
    include_resume: shareToken.include_resume,
    include_notes: shareToken.include_notes,
    expires_at: shareToken.expires_at,
  };
}