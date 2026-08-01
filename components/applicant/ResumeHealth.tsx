"use client";

import { CheckCircle2, AlertCircle, Activity, Lightbulb, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { getProfileCompletionScore } from "@/lib/queries/applicant";

export default function ResumeHealth({ profile, skills, projects, experience }: { profile: any, skills: any[], projects: any[], experience: any[] }) {
  const score = getProfileCompletionScore(profile, skills, projects, experience);
  
  const checks = [
    { label: "Resume Document", passed: !!profile?.cv_path, tip: "Upload a PDF resume to get AI-parsed and scored by recruiters" },
    { label: "Contact Info", passed: !!(profile?.email && profile?.phone), tip: "Add your phone number so recruiters can reach you directly" },
    { label: "Education Details", passed: !!(profile?.university && profile?.degree), tip: "Include your university and degree — this is a top filter for recruiters" },
    { label: "Technical Skills", passed: skills.length > 0, tip: "List technical skills like Python, React, or SQL — these power your AI match score" },
    { label: "Project Portfolio", passed: projects.length > 0, tip: "Add measurable achievements: 'Built X that improved Y by Z%'" },
    { label: "Work Experience", passed: experience.length > 0, tip: "Even short internships count! Mention Docker, CI/CD, or agile methodologies" },
    { label: "External Links (GitHub/LinkedIn)", passed: !!(profile?.github_url || profile?.linkedin_url), tip: "Link your GitHub to showcase code quality and collaboration" },
  ];

  let healthColor = "text-rose-500";
  let healthBg = "bg-rose-50 dark:bg-rose-500/15";
  let healthBar = "bg-rose-500";
  let healthLabel = "Needs Work";
  let healthEmoji = "🔧";

  if (score >= 80) {
    healthColor = "text-emerald-500";
    healthBg = "bg-emerald-50 dark:bg-emerald-500/15";
    healthBar = "bg-gradient-to-r from-teal to-emerald";
    healthLabel = "Excellent";
    healthEmoji = "🌟";
  } else if (score >= 50) {
    healthColor = "text-amber-500";
    healthBg = "bg-amber-50 dark:bg-amber-500/15";
    healthBar = "bg-amber-500";
    healthLabel = "Good";
    healthEmoji = "📈";
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-xl ${healthBg} ${healthColor}`}>
          <Activity className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-display font-bold text-primary dark:text-white">Resume Health</h2>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary dark:text-white">{score}<span className="text-lg text-text-muted">/100</span></span>
            <span className="text-lg ml-1">{healthEmoji}</span>
          </div>
          <span className={`text-sm font-medium ${healthColor}`}>{healthLabel}</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full ${healthBar} rounded-full transition-all`}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-primary dark:text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-teal" />
          Checklist & AI Tips
        </h3>
        {checks.map((check, i) => (
          <div key={i} className="group">
            <div className="flex items-start gap-3">
              {check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className={`text-sm ${check.passed ? 'text-text-secondary dark:text-slate-400' : 'text-primary dark:text-white font-medium'}`}>{check.label}</span>
                {!check.passed && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2"
                  >
                    <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{check.tip}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {score < 60 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-teal-light/70 to-emerald-light/60 dark:from-teal/10 dark:to-emerald/10 rounded-2xl border border-teal/20">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-5 h-5 text-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-teal-dark dark:text-teal">Quick Wins to Boost Your Score</p>
              <ul className="mt-2 text-xs text-emerald-dark/90 dark:text-teal-light/90 space-y-1 list-disc list-inside">
                <li>Upload a PDF resume — instant +20 points</li>
                <li>Add measurable achievements like “Improved performance by 30%”</li>
                <li>Mention in-demand skills like Docker, Kubernetes, or AWS</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
