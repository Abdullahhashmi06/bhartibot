"use client";

import { useState, useEffect } from "react";
import { Bookmark, MapPin, Building, ArrowRight, Sparkles, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Tag from "@/components/ui/Tag";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SavedJobCard({ job, onUnsave }: { job: any, onUnsave: (id: string) => void }) {
  const internship = job.internships;
  const [matchScore, setMatchScore] = useState(0);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  if (!internship) return null;

  useEffect(() => {
    calculateMatchScore();
    checkIfApplied();
  }, []);

  const calculateMatchScore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get applicant skills
    const { data: skills } = await supabase
      .from("applicant_skills")
      .select("skill")
      .eq("applicant_id", user.id);

    if (skills && skills.length > 0 && internship.skills && Array.isArray(internship.skills)) {
      const applicantSkillList = skills.map(s => s.skill.toLowerCase());
      let matches = 0;
      internship.skills.forEach((js: string) => {
        if (applicantSkillList.some(as => as.includes(js.toLowerCase()) || js.toLowerCase().includes(as))) {
          matches++;
        }
      });
      const score = internship.skills.length > 0 
        ? Math.round((matches / internship.skills.length) * 100) 
        : 60;
      setMatchScore(Math.min(score, 99));
    } else {
      setMatchScore(75);
    }
  };

  const checkIfApplied = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("internship_id", internship.id)
      .eq("email", user.email)
      .maybeSingle();

    if (data) setAlreadyApplied(true);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("applicant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !profile.full_name) {
        toast.error("Please complete your profile before applying");
        return;
      }

      const { error } = await supabase.from("applications").insert({
        internship_id: internship.id,
        applicant_name: profile.full_name,
        email: user.email || profile.email,
        phone: profile.phone || null,
        university: profile.university || null,
        degree: profile.degree || null,
        cgpa: profile.cgpa || null,
        linkedin_url: profile.linkedin_url || null,
        github_url: profile.github_url || null,
        portfolio_url: profile.portfolio_url || null,
        cv_path: profile.cv_path || null,
        status: "new",
      });

      if (error) throw error;
      toast.success("Application submitted successfully!");
      setAlreadyApplied(true);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  // Calculate deadline if available
  const hasDeadline = internship.application_deadline;
  const deadlineDate = hasDeadline ? new Date(internship.application_deadline) : null;
  const isDeadlinePassed = deadlineDate && deadlineDate < new Date();
  const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-card border border-border flex flex-col h-full hover:border-teal/50 hover:shadow-hover transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-border rounded-2xl flex items-center justify-center text-2xl font-bold text-primary shadow-subtle">
          {internship.company_name?.charAt(0) || "C"}
        </div>
        <div className="flex items-center gap-2">
          {/* AI Match Score - calculated from real skills */}
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg border border-purple-100">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-bold text-purple-700">{matchScore}%</span>
          </div>
          <button onClick={() => onUnsave(internship.id)} className="p-2 text-teal bg-teal/10 rounded-xl hover:bg-teal/20 transition-colors">
            <Bookmark className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
      
      <h3 className="font-display font-bold text-lg text-primary line-clamp-1">{internship.title}</h3>
      <p className="text-sm font-medium text-text-secondary mb-4">{internship.company_name}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary bg-slate-50 px-2.5 py-1.5 rounded-lg border border-border w-fit">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {internship.location}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary bg-slate-50 px-2.5 py-1.5 rounded-lg border border-border w-fit">
          <Building className="w-3.5 h-3.5 text-slate-400" /> {internship.work_mode}
        </div>
        {daysLeft !== null && daysLeft > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 w-fit">
            <Clock className="w-3.5 h-3.5" /> {daysLeft} days left to apply
          </div>
        )}
        {isDeadlinePassed && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 w-fit">
            <Calendar className="w-3.5 h-3.5" /> Deadline passed
          </div>
        )}
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <div className="flex flex-col">
          <Tag tone="purple" className="font-semibold">{internship.stipend || "Unpaid"}</Tag>
          {hasDeadline && (
            <span className="text-[10px] text-text-muted mt-1">{new Date(internship.application_deadline).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {alreadyApplied ? (
            <Button variant="secondary" size="sm" disabled className="bg-slate-100 text-slate-500 text-xs">
              Applied
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={handleApply} disabled={applying || isDeadlinePassed || false}>
              {applying ? "Applying..." : "Apply Now"}
            </Button>
          )}
          <Link href={`/applicant/internships`}>
            <Button variant="ghost" size="sm" className="text-teal p-0 hover:bg-transparent hover:text-teal-dark flex items-center gap-1 font-semibold">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
