import { createClient } from "@/lib/supabase/server";
import ResumeUploader from "@/components/applicant/ResumeUploader";
import ResumeHealth from "@/components/applicant/ResumeHealth";
import ResumeAnalyzer from "@/components/applicant/ResumeAnalyzer";
import { getApplicantProfile, getApplicantSkills, getApplicantProjects, getApplicantExperience } from "@/lib/queries/applicant";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: skills }, { data: projects }, { data: experience }] = await Promise.all([
    getApplicantProfile(supabase, user.id),
    getApplicantSkills(supabase, user.id),
    getApplicantProjects(supabase, user.id),
    getApplicantExperience(supabase, user.id)
  ]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">Resume & Documents</h1>
        <p className="text-text-secondary mt-1">Manage your resume and see how well it matches industry standards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ResumeUploader currentCvPath={profile?.cv_path} userId={user.id} />
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
