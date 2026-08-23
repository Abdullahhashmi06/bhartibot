import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/supabase/server";
import ProfileClient from "@/components/applicant/ProfileClient";

export const dynamic = "force-dynamic";

/**
 * Thin auth shell — data fetching moved to ProfileClient via React Query.
 */
export default async function ProfilePage() {
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/applicant-auth");

  return <ProfileClient userId={headerUser.id} />;
}
