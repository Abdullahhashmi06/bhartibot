import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/supabase/server";
import PreferencesClient from "./PreferencesClient";

export const dynamic = "force-dynamic";

export default function ApplicantPreferencesPage() {
  if (!getUserFromHeaders()) redirect("/applicant-auth");
  return <PreferencesClient />;
}
