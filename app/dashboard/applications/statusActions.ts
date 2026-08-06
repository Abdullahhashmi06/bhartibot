"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendRejectionEmailAction, sendShortlistedEmailAction } from "./actions";
import { ApplicationStatus } from "@/lib/types";

/**
 * Server action: update an application's status and revalidate
 * all relevant cached pages so counts and column views update immediately.
 *
 * Also fires a rejection email (fire-and-forget) when status → "rejected".
 */
export async function updateStatusServerAction(
  applicationId: string,
  newStatus: ApplicationStatus,
  prevStatus: ApplicationStatus | string,
  preFetched?: {
    applicantEmail?: string;
    applicantName?: string;
    internshipTitle?: string;
    organizationName?: string;
    internshipId?: string;
  }
): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId)
      .select();

    if (error) {
      console.error("[statusActions] Update error:", error);
      return { error: error.message };
    }
    
    if (!data || data.length === 0) {
      return { error: "Failed to update status. Please check if you have permission to edit this application." };
    }

    // Revalidate all pages that display status-dependent data
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/applications", "layout");
    revalidatePath("/dashboard/applications/shortlisted", "layout");
    if (preFetched?.internshipId) {
      // Revalidate the internship applications page (covers all tab variants because
      // Next.js revalidates the entire route segment, regardless of searchParams)
      revalidatePath(`/dashboard/applications/${preFetched.internshipId}`, "layout");
      revalidatePath(`/dashboard/applications/${preFetched.internshipId}`, "page");
    }

    // Fire status-change emails (fire-and-forget, never blocks).
    // Dedup is handled by the previous-status guard above plus the
    // per-application in-memory markers in the actions — emails only fire
    // when the status ACTUALLY changes, never on refresh/notes edits.
    if (newStatus === "rejected" && prevStatus !== "rejected") {
      sendRejectionEmailAction(applicationId, {
        applicantEmail: preFetched?.applicantEmail,
        applicantName: preFetched?.applicantName,
        internshipTitle: preFetched?.internshipTitle,
        organizationName: preFetched?.organizationName,
      }).catch((err) => {
        console.error("[statusActions] Rejection email fire-and-forget failed:", err);
      });
    }

    if (newStatus === "shortlisted" && prevStatus !== "shortlisted") {
      sendShortlistedEmailAction(applicationId, {
        applicantEmail: preFetched?.applicantEmail,
        applicantName: preFetched?.applicantName,
        internshipTitle: preFetched?.internshipTitle,
        organizationName: preFetched?.organizationName,
      }).catch((err) => {
        console.error("[statusActions] Shortlisted email fire-and-forget failed:", err);
      });
    }

    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Status update failed";
    console.error("[statusActions] updateStatusServerAction error:", msg);
    return { error: msg };
  }
}
