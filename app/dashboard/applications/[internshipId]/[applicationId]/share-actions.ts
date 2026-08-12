import { scryptSync, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createShareToken, revokeShareToken, getShareTokensByApplication } from "@/lib/queries/share";
import { sendShareReviewEmail, buildShareReviewEmailHtml } from "@/lib/email/share-review";
import { getAppBaseUrl } from "@/lib/utils";
import type { SharedSection, ShareExpiration, ShareToken } from "@/lib/types";

/**
 * Hashes a password using scrypt with a random salt.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Calculates the expiration timestamp based on the selected option.
 */
function calculateExpiresAt(expiration: ShareExpiration): string | null {
  switch (expiration) {
    case "24h":
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    case "never":
      return null;
    default:
      return null;
  }
}

export type CreateShareResult =
  | { success: true; token: ShareToken; shareUrl: string }
  | { success: false; error: string };

export async function createShareLink(
  applicationId: string,
  internshipId: string,
  opts: {
    sharedSections: SharedSection[];
    expiration: ShareExpiration;
    password?: string;
    includeResume: boolean;
    includeNotes: boolean;
  }
): Promise<CreateShareResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  // Get the organization ID from the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Recruiter profile not found." };
  }

  // Get the internship to verify it belongs to the user's organization
  const { data: internship } = await supabase
    .from("internships")
    .select("organization_id")
    .eq("id", internshipId)
    .single();

  if (!internship || internship.organization_id !== profile.organization_id) {
    return { success: false, error: "Internship not found." };
  }

  // C6 (security): the application must belong to the SAME internship (and
  // therefore the same org) as the internshipId the recruiter claims. Without
  // this, a recruiter could create a share token referencing another org's
  // candidate application and exfiltrate their data through the review URL.
  const { data: application } = await supabase
    .from("applications")
    .select("internship_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || application.internship_id !== internshipId) {
    return {
      success: false,
      error: "Application not found for this internship.",
    };
  }

  const passwordHash = opts.password ? hashPassword(opts.password) : null;
  const expiresAt = calculateExpiresAt(opts.expiration);

  const { token, error } = await createShareToken(supabase, {
    application_id: applicationId,
    organization_id: profile.organization_id,
    created_by: user.id,
    shared_sections: opts.sharedSections,
    expires_at: expiresAt,
    password_hash: passwordHash,
    include_resume: opts.includeResume,
    include_notes: opts.includeNotes,
  });

  if (error || !token) {
    return { success: false, error: error ?? "Failed to create share link." };
  }

  const origin = getAppBaseUrl();
  const shareUrl = `${origin}/share/review/${token.token}`;

  return { success: true, token, shareUrl };
}

export type RevokeShareResult =
  | { success: true }
  | { success: false; error: string };

export async function revokeShare(tokenId: string): Promise<RevokeShareResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const result = await revokeShareToken(supabase, tokenId);
  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to revoke share." };
  }

  return { success: true };
}

export type GetSharesResult =
  | { success: true; shares: ShareToken[] }
  | { success: false; error: string };

export async function getSharesForApplication(
  applicationId: string
): Promise<GetSharesResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const shares = await getShareTokensByApplication(supabase, applicationId);
  return { success: true, shares };
}

export type SendShareEmailResult =
  | { success: true; sentTo: string[] }
  | { success: false; error: string };

export async function sendShareEmail(
  opts: {
    to: string[];
    applicantName: string;
    internshipTitle: string;
    organizationName: string;
    reviewUrl: string;
    expiresAt: string | null;
  }
): Promise<SendShareEmailResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const html = buildShareReviewEmailHtml({
    applicantName: opts.applicantName,
    internshipTitle: opts.internshipTitle,
    organizationName: opts.organizationName,
    reviewUrl: opts.reviewUrl,
    expiresAt: opts.expiresAt,
  });

  const result = await sendShareReviewEmail({
    to: opts.to,
    subject: `Candidate Review: ${opts.applicantName} - ${opts.internshipTitle}`,
    html,
  });

  if (!result.success) {
    console.error("[Share Action] Email failed:", result.error);
    // Report still exists, return success with email failure info
    return { success: false, error: result.error ?? "Email sending failed." };
  }

  return { success: true, sentTo: result.sentTo ?? opts.to };
}