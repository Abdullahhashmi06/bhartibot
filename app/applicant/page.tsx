import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/supabase/server";
import ApplicantDashboardClient from "@/components/applicant/ApplicantDashboardClient";

export const dynamic = "force-dynamic";

/**
 * Thin auth shell — all data fetching moved to ApplicantDashboardClient via React Query.
 * This makes the server component resolve in ~5ms so loading.tsx barely flashes
 * on return navigation when cached data is available.
 */
export default async function ApplicantDashboardPage() {
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/applicant-auth");

  return (
    <ApplicantDashboardClient
      userId={headerUser.id}
      userEmail={headerUser.email}
    />
  );
}
