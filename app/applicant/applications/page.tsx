import { createClient } from "@/lib/supabase/server";
import { getApplicantApplications } from "@/lib/queries/applicant";
import ApplicationCard from "@/components/applicant/ApplicationCard";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: applications } = await getApplicantApplications(supabase, user.email || "");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">My Applications</h1>
        <p className="text-text-secondary mt-1">Track the status of your internship applications.</p>
      </div>

      <div className="space-y-6">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <ApplicationCard key={app.id} app={app} />
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center shadow-card border border-border flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary mb-2">No Applications Yet</h2>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              You haven&apos;t applied to any internships yet. Explore available opportunities and start your journey!
            </p>
            <Link href="/applicant/internships">
              <Button variant="gradient">Find Internships</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
