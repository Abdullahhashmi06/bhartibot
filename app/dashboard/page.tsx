import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/supabase/server";
import RecruiterDashboardClient from "@/components/dashboard/RecruiterDashboardClient";

export const dynamic = "force-dynamic";

/**
 * Thin auth shell — data fetching moved to RecruiterDashboardClient via React Query.
 * This makes the server component resolve in ~5ms so loading.tsx barely flashes
 * on return navigation when cached data is available.
 */
export default async function DashboardPage() {
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/login");

  return (
    <RecruiterDashboardClient
      userId={headerUser.id}
      userEmail={headerUser.email}
    />
  );
}
