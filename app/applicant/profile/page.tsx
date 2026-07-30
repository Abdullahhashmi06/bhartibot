import { createClient } from "@/lib/supabase/server";
import { getApplicantProfile, getApplicantSkills, getApplicantProjects, getApplicantExperience } from "@/lib/queries/applicant";
import ProfileHeader from "@/components/applicant/ProfileHeader";
import PersonalInfoEditor from "@/components/applicant/PersonalInfoEditor";
import EducationEditor from "@/components/applicant/EducationEditor";
import SkillEditor from "@/components/applicant/SkillEditor";
import ProjectEditor from "@/components/applicant/ProjectEditor";
import ExperienceEditor from "@/components/applicant/ExperienceEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <ProfileHeader profile={profile} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <PersonalInfoEditor profile={profile} />
          <EducationEditor profile={profile} />
          <ExperienceEditor experience={experience || []} />
          <ProjectEditor projects={projects || []} />
        </div>
        <div className="space-y-8">
          <SkillEditor skills={skills || []} />
        </div>
      </div>
    </div>
  );
}
