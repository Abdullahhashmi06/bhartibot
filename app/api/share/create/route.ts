import { NextRequest, NextResponse } from "next/server";
import { createShareLink } from "@/app/dashboard/applications/[internshipId]/[applicationId]/share-actions";
import type { SharedSection, ShareExpiration } from "@/lib/types";

/**
 * POST /api/share/create
 * Creates a new secure share link for a candidate review.
 * Expects authenticated recruiter session via cookies (server client).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { applicationId, internshipId, sharedSections, expiration, password, includeResume, includeNotes } = body;

    // Validate required fields
    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json(
        { success: false, error: "Application ID is required." },
        { status: 400 }
      );
    }

    if (!internshipId || typeof internshipId !== "string") {
      return NextResponse.json(
        { success: false, error: "Internship ID is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(sharedSections) || sharedSections.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one section must be selected." },
        { status: 400 }
      );
    }

    // Validate expiration
    const validExpirations: ShareExpiration[] = ["never", "24h", "7d", "30d"];
    if (!validExpirations.includes(expiration)) {
      return NextResponse.json(
        { success: false, error: "Invalid expiration value." },
        { status: 400 }
      );
    }

    const result = await createShareLink(applicationId, internshipId, {
      sharedSections: sharedSections as SharedSection[],
      expiration: expiration as ShareExpiration,
      password: password || undefined,
      includeResume: Boolean(includeResume),
      includeNotes: Boolean(includeNotes),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      shareUrl: result.shareUrl,
      token: result.token,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Share API] POST /api/share/create:", message);
    return NextResponse.json(
      { success: false, error: "Failed to create share link." },
      { status: 500 }
    );
  }
}
