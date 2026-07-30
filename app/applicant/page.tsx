import { createClient } from "@/lib/supabase/server";
import {
  getApplicantProfile,
  getApplicantApplications,
  getSavedJobs,
  getApplicantSkills,
  getApplicantProjects,
  getApplicantExperience
} from "@/lib/queries/applicant";
import { Briefcase, Bookmark, Clock, CheckCircle, XCircle, Video, Gift } from "lucide-react";
import ProfileCompletion from "@/components/applicant/ProfileCompletion";
import ResumeHealth from "@/components/applicant/ResumeHealth";
import RecommendedJobs from "@/components/applicant/RecommendedJobs";
import ApplicantStats from "@/components/applicant/ApplicantStats";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ApplicantDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: applications }, { data: savedJobs }, { data: skills }, { data: projects }, { data: experience }] = await Promise.all([
    getApplicantProfile(supabase, user.id),
    getApplicantApplications(supabase, user.email || ""),
    getSavedJobs(supabase, user.id),
    getApplicantSkills(supabase, user.id),
    getApplicantProjects(supabase, user.id),
    getApplicantExperience(supabase, user.id)
  ]);

  const interviewCount = applications?.filter(a => a.status === 'interview').length || 0;
  const offerCount = applications?.filter(a => a.status === 'offer' || a.status === 'hired').length || 0;

  const stats = {
    total: applications?.length || 0,
    saved: savedJobs?.length || 0,
    underReview: applications?.filter(a => ['under_review', 'ai_reviewed', 'viewed'].includes(a.status)).length || 0,
    shortlisted: applications?.filter(a => ['shortlisted', 'interview'].includes(a.status)).length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    interviews: interviewCount,
    offers: offerCount,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">Welcome back, {profile?.full_name?.split(" ")[0] || "Applicant"}! 👋</h1>
        <p className="text-text-secondary mt-1">Here is what&apos;s happening with your internship applications.</p>
      </div>

      <ApplicantStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-primary">Recent Applications</h2>
              <Link href="/applicant/applications">
                <Button variant="ghost" size="sm" className="text-teal">View All</Button>
              </Link>
            </div>
            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app: any) => {
                  const getStatusConfig = (status: string) => {
                    switch (status) {
                      case "applied": case "under_review": return { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
                      case "ai_reviewed": case "viewed": return { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
                      case "shortlisted": case "interview": return { color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
                      case "offer": case "hired": return { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
                      case "rejected": return { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" };
                      case "withdrawn": return { color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" };
                      default: return { color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" };
                    }
                  };
                  const statusConf = getStatusConfig(app.status);

                  return (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border hover:border-teal/30 hover:shadow-subtle transition-all duration-200 group gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-bold text-slate-700 shrink-0">
                          {app.internships?.company_name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary group-hover:text-teal transition-colors">{app.internships?.title || "Internship"}</h3>
                          <p className="text-sm text-text-secondary">{app.internships?.company_name || "Company"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConf.bg} ${statusConf.color} ${statusConf.border} border capitalize`}>
                          {app.status.replace("_", " ")}
                        </span>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No applications yet. Start exploring!</p>
                <Link href="/applicant/internships">
                  <Button variant="outline" className="mt-4">Find Internships</Button>
                </Link>
              </div>
            )}
          </div>

          <RecommendedJobs skills={skills || []} />
        </div>

        <div className="space-y-8">
          <ProfileCompletion profile={profile} skills={skills || []} projects={projects || []} experience={experience || []} />
          <ResumeHealth profile={profile} skills={skills || []} projects={projects || []} experience={experience || []} />
        </div>
      </div>
    </div>
  );
}
