"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowRight, Building, MapPin, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import CircularGauge from "@/components/ai/CircularGauge";

export default function RecommendedJobs({ skills }: { skills: any[] }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from("internships").select("*").eq("status", "published").limit(10);
      
      if (data) {
        const applicantSkillList = skills.map(s => s.skill.toLowerCase());
        
        const scoredJobs = data.map(job => {
          let matchedSkills: string[] = [];
          let missingSkills: string[] = [];
          
          if (job.skills && Array.isArray(job.skills)) {
            job.skills.forEach((js: string) => {
              const isMatched = applicantSkillList.some(
                as => as.includes(js.toLowerCase()) || js.toLowerCase().includes(as)
              );
              if (isMatched) {
                matchedSkills.push(js);
              } else {
                missingSkills.push(js);
              }
            });
          }
          
          const total = job.skills?.length || 1;
          const matchCount = matchedSkills.length;
          const score = Math.round((matchCount / total) * 100);
          
          // Generate reasoning text
          let reasoning = "";
          if (matchCount > 0 && skills.length > 0) {
            const topSkill = skills[0]?.skill || "";
            const matchedNames = matchedSkills.slice(0, 2).join(" and ");
            if (matchedNames) {
              reasoning = `Your ${matchedNames} experience closely matches the requirements for this role.`;
            }
          }
          
          return { 
            ...job, 
            matchScore: Math.min(score, 100), 
            matchedSkills, 
            missingSkills,
            reasoning
          };
        }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
        
        setJobs(scoredJobs);
      }
      setLoading(false);
    };
    
    fetchJobs();
  }, [skills]);

  if (loading || jobs.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-ai" /> Recommended For You
        </h2>
        <Link href="/applicant/internships">
          <Button variant="ghost" size="sm" className="text-purple-ai">View All</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="p-4 rounded-2xl border border-border hover:border-purple-200 transition-colors bg-slate-50/50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-primary truncate">{job.title}</h3>
                <p className="text-sm text-text-secondary">{job.company_name}</p>
              </div>
              <div className="shrink-0 ml-3">
                <CircularGauge score={job.matchScore} size={52} />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-text-muted mt-3 mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
              <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {job.work_mode}</span>
            </div>
            
            {/* Reasoning text */}
            {job.reasoning && (
              <div className="flex items-start gap-1.5 mb-3 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{job.reasoning}</span>
              </div>
            )}
            
            {/* Matched & Missing Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {job.matchedSkills?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 mb-1 uppercase tracking-wide">✓ Matched Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {job.matchedSkills.slice(0, 4).map((skill: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {job.missingSkills?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 mb-1 uppercase tracking-wide">○ Skills to Develop</p>
                    <div className="flex flex-wrap gap-1">
                      {job.missingSkills.slice(0, 4).map((skill: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Link href={`/applicant/internships`} className="block">
              <Button variant="outline" className="w-full text-sm py-1.5 h-auto hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors">View Role</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
