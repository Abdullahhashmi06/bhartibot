"use client";

import { useQuery } from "@tanstack/react-query";
import ProfileHeader from "@/components/applicant/ProfileHeader";
import PersonalInfoEditor from "@/components/applicant/PersonalInfoEditor";
import EducationEditor from "@/components/applicant/EducationEditor";
import SkillEditor from "@/components/applicant/SkillEditor";
import ProjectEditor from "@/components/applicant/ProjectEditor";
import ExperienceEditor from "@/components/applicant/ExperienceEditor";

export default function ProfileClient({
  userId,
}: {
  userId: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["applicant-profile", userId],
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
  });

  // Show skeleton only when genuinely no cached data
  if (isLoading || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="animate-shimmer h-32 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-shimmer h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
          <div className="animate-shimmer h-64 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  const { profile, skills, projects, experience } = data;

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
