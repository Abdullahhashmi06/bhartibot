import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import ResumeUploader from "@/components/applicant/ResumeUploader";
import ResumeHealth from "@/components/applicant/ResumeHealth";
import ResumeAnalyzer from "@/components/applicant/ResumeAnalyzer";
import { getApplicantProfile, getApplicantSkills, getApplicantProjects, getApplicantExperience } from "@/lib/queries/applicant";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) return null;

  const [{ data: profile }, { data: skills }, { data: projects }, { data: experience }] = await Promise.all([
    getApplicantProfile(supabase, headerUser.id),
    getApplicantSkills(supabase, headerUser.id),
    getApplicantProjects(supabase, headerUser.id),
    getApplicantExperience(supabase, headerUser.id)
  ]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary dark:text-white">Resume & Documents</h1>
        <p className="text-text-secondary dark:text-slate-400 mt-1">Manage your resume and see how well it matches industry standards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ResumeUploader currentCvPath={profile?.cv_path} userId={headerUser.id} />
          <ResumeAnalyzer hasCv={Boolean(profile?.cv_path)} />

          <div className="rounded-3xl border border-teal/30 bg-gradient-to-br from-teal-light/40 via-white to-emerald-light/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 p-6 sm:p-7 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light/80 dark:bg-teal/20 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-teal-dark dark:text-teal">
                New Feature
              </span>
              <h3 className="text-lg font-display font-bold text-primary dark:text-white">
                Role-Specific CV Optimization
              </h3>
              <p className="text-xs text-text-secondary dark:text-slate-400 max-w-xl leading-relaxed">
                Applying for a specific internship? Compare your CV against role requirements, match critical keywords, and accept AI-powered quantifiable bullet rewrites.
              </p>
            </div>
            <a
              href="/applicant/cv-optimization"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-3 text-xs font-semibold text-white shadow-teal hover:opacity-95 transition-all shrink-0"
            >
              Open CV Optimizer →
            </a>
          </div>
        </div>
        
        <div className="space-y-8">
          <ResumeHealth 
            profile={profile} 
            skills={skills || []} 
            projects={projects || []} 
            experience={experience || []} 
          />
        </div>
      </div>
    </div>
  );
}
