import { redirect } from "next/navigation";
import { getUserFromHeaders } from "@/lib/supabase/server";
import InterviewPrepClient from "./InterviewPrepClient";

export const dynamic = "force-dynamic";

export default function ApplicantInterviewPrepPage() {
  if (!getUserFromHeaders()) redirect("/applicant-auth");
  return <InterviewPrepClient />;
}
