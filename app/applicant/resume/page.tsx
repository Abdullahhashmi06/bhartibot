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
