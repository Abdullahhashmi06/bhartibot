"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getProfileCompletionScore } from "@/lib/queries/applicant";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ProfileCompletion({ profile, skills, projects, experience }: { profile: any, skills: any[], projects: any[], experience: any[] }) {
  const score = getProfileCompletionScore(profile, skills, projects, experience);
  const data = [
    { name: "Completed", value: score },
    { name: "Remaining", value: 100 - score }
  ];
  // Brand teal + neutral track that reads well on both light & dark surfaces
  const COLORS = ["#17C6B5", "#E2E8F0"];

  const steps = [
    { label: "Basic Info", done: !!(profile?.full_name && profile?.location) },
    { label: "Education", done: !!profile?.university },
    { label: "Skills", done: skills && skills.length > 0 },
    { label: "Experience", done: experience && experience.length > 0 },
    { label: "Projects", done: projects && projects.length > 0 },
    { label: "Resume Upload", done: !!profile?.cv_path },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-border dark:border-slate-700">
      <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-6">Profile Completion</h2>
      
      <div className="flex justify-center mb-6 relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={75}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-display font-bold text-primary dark:text-white">{score}%</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-teal" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            )}
            <span className={`text-sm ${step.done ? 'text-text-secondary dark:text-slate-400' : 'text-primary dark:text-white font-medium'}`}>{step.label}</span>
          </div>
        ))}
      </div>

      {score < 100 && (
        <Link href="/applicant/profile" className="block">
          <Button variant="outline" className="w-full">Complete Profile</Button>
        </Link>
      )}
    </div>
  );
}
