import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShareToken, SharedSection, SharedReviewData } from "@/lib/types";
import { getCvSignedUrl } from "@/lib/queries/storage";
import { getNotesByApplication } from "@/lib/queries/recruiter-notes";
import { scryptSync } from "crypto";

export function verifyPassword(password: string, passwordHash: string): boolean {
  try {
    const [salt, key] = passwordHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return derivedKey === key;
  } catch {
    return false;
  }
}

export async function createShareToken(
  supabase: SupabaseClient,
  input: {
    application_id: string;
    organization_id: string;
    created_by: string;
    shared_sections: SharedSection[];
    expires_at: string | null;
    password_hash: string | null;
    include_resume: boolean;
    include_notes: boolean;
  }
): Promise<{ token: ShareToken | null; error: string | null }> {
  const { data, error } = await supabase
    .from("share_tokens")
    .insert({
      application_id: input.application_id,
      organization_id: input.organization_id,
      created_by: input.created_by,
      shared_sections: input.shared_sections,
      expires_at: input.expires_at,
      password_hash: input.password_hash,
      include_resume: input.include_resume,
      include_notes: input.include_notes,
    })
    .select()
    .single();

  if (error) {
    console.error("[Share] createShareToken:", error.message);
    return { token: null, error: error.message };
  }

  return { token: data as ShareToken, error: null };
}

export async function getShareTokensByApplication(
  supabase: SupabaseClient,
  applicationId: string
): Promise<ShareToken[]> {
  const { data, error } = await supabase
    .from("share_tokens")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Share] getShareTokensByApplication:", error.message);
    return [];
  }

  return (data as ShareToken[]) ?? [];
}

export async function getShareTokenByToken(
  supabase: SupabaseClient,
  token: string
): Promise<ShareToken | null> {
  const { data, error } = await supabase
    .from("share_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[Share] getShareTokenByToken:", error.message);
    return null;
  }

  return (data as ShareToken) ?? null;
}

export async function incrementShareViewCount(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { data: current } = await supabase
    .from("share_tokens")
    .select("viewed_count")
    .eq("id", id)
    .single();

  if (current) {
    const { error } = await supabase
      .from("share_tokens")
      .update({
        viewed_count: (current.viewed_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[Share] incrementShareViewCount:", error.message);
    }
  }
}

export async function revokeShareToken(
  supabase: SupabaseClient,
  tokenId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("share_tokens")
    .update({ is_revoked: true })
    .eq("id", tokenId);

  if (error) {
    console.error("[Share] revokeShareToken:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export type SharedReviewFetchResult =
  | { status: "success"; data: SharedReviewData }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "password_required"; invalidPassword?: boolean }
  | { status: "not_found" };

export async function getSharedReviewDataByToken(
  supabase: SupabaseClient,
  tokenStr: string,
  password?: string
): Promise<SharedReviewFetchResult> {
  const shareToken = await getShareTokenByToken(supabase, tokenStr);
  if (!shareToken) {
    return { status: "not_found" };
  }

  if (shareToken.is_revoked) {
    return { status: "revoked" };
  }

  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return { status: "expired" };
  }

  if (shareToken.password_hash) {
    if (!password) {
      return { status: "password_required" };
    }
    if (!verifyPassword(password, shareToken.password_hash)) {
      return { status: "password_required", invalidPassword: true };
    }
  }

  // Fetch Application
  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", shareToken.application_id)
    .maybeSingle();

  if (!application) {
    return { status: "not_found" };
  }

  // Fetch Internship
  const { data: internship } = await supabase
    .from("internships")
    .select("title, field, organization_id")
    .eq("id", application.internship_id)
    .maybeSingle();

  if (!internship) {
    return { status: "not_found" };
  }

  // Fetch Organization
  const { data: org } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", shareToken.organization_id)
    .maybeSingle();

  const orgName = org?.name ?? "Organization";

  // Fetch AI Analysis
  const { data: aiAnalysis } = await supabase
    .from("candidate_ai_analysis")
    .select("*")
    .eq("application_id", application.id)
    .maybeSingle();

  // Fetch Notes if requested
  let recruiterNotesCombined: string | null = null;
  if (shareToken.include_notes) {
    const notes = await getNotesByApplication(supabase, application.id);
    if (notes.length > 0) {
      recruiterNotesCombined = notes.map((n) => n.content).join("\n\n");
    } else if (aiAnalysis?.recruiter_notes) {
      recruiterNotesCombined = aiAnalysis.recruiter_notes;
    }
  }

  // Fetch CV Link if requested
  let cvUrl: string | null = null;
  if (shareToken.include_resume && application.cv_path) {
    cvUrl = await getCvSignedUrl(supabase, application.cv_path);
  }

  // Increment view count asynchronously
  incrementShareViewCount(supabase, shareToken.id);

  const sharedData: SharedReviewData = {
    token: shareToken.token,
    applicant_name: application.applicant_name,
    email: application.email,
    phone: application.phone ?? null,
    university: application.university ?? null,
    degree: application.degree ?? null,
    internship_title: internship.title,
    internship_field: internship.field ?? null,
    organization_name: orgName,
    match_score: aiAnalysis?.match_score ?? null,
    strengths: aiAnalysis?.strengths ?? [],
    weaknesses: aiAnalysis?.weaknesses ?? [],
    missing_skills: aiAnalysis?.missing_skills ?? [],
    recommendation: aiAnalysis?.recommendation ?? null,
    reasoning: aiAnalysis?.reasoning ?? null,
    parsed_resume: aiAnalysis?.parsed_resume ?? null,
    interview_questions: aiAnalysis?.interview_questions ?? null,
    recruiter_notes: recruiterNotesCombined,
    cv_url: cvUrl,
    shared_sections: shareToken.shared_sections ?? [],
    include_resume: shareToken.include_resume,
    include_notes: shareToken.include_notes,
    expires_at: shareToken.expires_at,
  };

  return { status: "success", data: sharedData };
}