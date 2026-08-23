import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/supabase/server";
import ApplicationsClient from "@/components/applicant/ApplicationsClient";

export const dynamic = "force-dynamic";

/**
 * Thin auth shell — data fetching moved to ApplicationsClient via React Query.
 */
export default async function ApplicationsPage() {
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/applicant-auth");

  return <ApplicationsClient userId={headerUser.id} />;
}
