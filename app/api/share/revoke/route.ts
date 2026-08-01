import { NextRequest, NextResponse } from "next/server";
import { revokeShare } from "@/app/dashboard/applications/[internshipId]/[applicationId]/share-actions";

/**
 * POST /api/share/revoke
 * Revokes a shared review link. After revocation, the URL immediately becomes invalid.
 * Generates a new token if the recruiter wants to share again later.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenId } = body;

    if (!tokenId || typeof tokenId !== "string") {
      return NextResponse.json(
        { success: false, error: "Token ID is required." },
        { status: 400 }
      );
    }

    const result = await revokeShare(tokenId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Share API] POST /api/share/revoke:", message);
    return NextResponse.json(
      { success: false, error: "Failed to revoke share link." },
      { status: 500 }
    );
  }
}
