import { NextRequest, NextResponse } from "next/server";
import { sendShareEmail } from "@/app/dashboard/applications/[internshipId]/[applicationId]/share-actions";

/**
 * POST /api/share/send-email
 * Sends a professional email with the candidate review link to one or more recipients.
 * The report still exists even if email sending fails — failures are logged.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, applicantName, internshipTitle, organizationName, reviewUrl, expiresAt } = body;

    // Validate required fields
    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one recipient email is required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = to.filter((e: string) => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    if (!applicantName || typeof applicantName !== "string") {
      return NextResponse.json(
        { success: false, error: "Applicant name is required." },
        { status: 400 }
      );
    }

    if (!reviewUrl || typeof reviewUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Review URL is required." },
        { status: 400 }
      );
    }

    const result = await sendShareEmail({
      to,
      applicantName,
      internshipTitle: internshipTitle || "Internship",
      organizationName: organizationName || "Organization",
      reviewUrl,
      expiresAt: expiresAt || null,
    });

    if (!result.success) {
      // Log the failure but still return a reasonable response
      console.error("[Share Email API] Failed to send:", result.error);
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send email. The review link still exists and can be shared manually.",
        sentTo: [],
      });
    }

    return NextResponse.json({
      success: true,
      sentTo: result.sentTo || to,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Share Email API] POST error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email. The review link still exists and can be shared manually.",
      },
      { status: 500 }
    );
  }
}
