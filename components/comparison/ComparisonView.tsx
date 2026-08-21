"use client"

import { useState } from "react";
import { Application, CandidateAiAnalysis } from "@/lib/types";
import { motion } from "framer-motion";
import ComparisonToolbar from "./ComparisonToolbar";
import ComparisonHeader from "./ComparisonHeader";
import ComparisonMetric from "./ComparisonMetric";
import ComparisonSkills from "./ComparisonSkills";
import ComparisonAnswers from "./ComparisonAnswers";
import { ProgressBar } from "@/components/ai/ProgressBar";
import CircularGauge from "@/components/ai/CircularGauge";
import Tag from "@/components/ui/Tag";
import { cn } from "@/lib/utils";
import {
  Award,
  Code2,
  FileCode,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

interface Props {
  candidates: Application[];
  analyses: Record<string, CandidateAiAnalysis | null>;
  answers: Record<string, { question: string; answer: string }[]>;
  internshipId?: string;
}

export default function ComparisonView({ candidates, analyses, answers }: Props) {
  const [activeTab, setActiveTab] = useState<string>("scores");

  if (!candidates || candidates.length < 2) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-primary mb-2">Not enough candidates</h2>
        <p className="text-text-secondary">Please select at least 2 candidates to compare.</p>
      </div>
    );
  }

  const getRecommendationTone = (rec: string) => {
    switch (rec?.toLowerCase()) {
      case "hire": return "teal";
      case "interview": return "purple";
      case "maybe": return "amber";
      case "reject": return "rose";
      default: return "neutral";
    }
  };

  // Derived score dimensions based on match_score + offset (matching AiAnalysisPanel pattern)
  function getScoreDims(candidateId: string) {
    const analysis = analyses[candidateId];
    return {
      technical: analysis?.technical_score ?? 0,
      education: analysis?.education_score ?? 0,
      experience: analysis?.experience_score ?? 0,
      communication: analysis?.communication_score ?? 0,
      cultureFit: analysis?.culture_fit_score ?? 0,
      projects: analysis?.resume_quality_score ?? 0,
    };
  }

  const tabs = [
    { id: "scores", label: "AI Scores", icon: <Sparkles className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <Users className="w-4 h-4" /> },
    { id: "skills", label: "Skills", icon: <Code2 className="w-4 h-4" /> },
    { id: "projects", label: "Projects", icon: <GitBranch className="w-4 h-4" /> },
    { id: "answers", label: "Screening", icon: <FileCode className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <ComparisonToolbar count={candidates.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Winner Banner */}
        <ComparisonHeader candidates={candidates} analyses={analyses} />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 mt-8 border-b border-border pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeTab === tab.id
                  ? "bg-teal-light text-teal-dark border border-teal/30 shadow-sm dark:bg-teal/15 dark:text-teal dark:border-teal/40"
                  : "text-text-secondary hover:text-primary hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* AI SCORES TAB */}
        {activeTab === "scores" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-card border border-border p-6 md:p-8 space-y-8"
          >
            {/* Match Score Gauges Row */}
            <section>
              <h3 className="text-lg font-display font-semibold text-primary mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-teal" />
                Match Score Comparison
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {candidates.map((c, i) => {
                  const score = analyses[c.id]?.match_score ?? 0;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center p-6 rounded-2xl border border-border bg-slate-50/50 hover:shadow-sm transition-shadow"
                    >
                      <CircularGauge score={score} size={120} strokeWidth={8} label="Match Score" />
                      <div className="mt-3">
                        <Tag tone={getRecommendationTone(analyses[c.id]?.recommendation ?? "") as any}>
                          {analyses[c.id]?.recommendation || "N/A"}
                        </Tag>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Multi-Dimensional Score Rows */}
            <section className="space-y-8">
              <h3 className="text-lg font-display font-semibold text-primary border-b border-border/50 pb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-ai" />
                Multi-Dimensional Scoring
              </h3>

              {candidates.map((c) => {
                const dims = getScoreDims(c.id);
                return (
                  <div key={c.id} className="rounded-2xl border border-border bg-slate-50/30 p-5 space-y-4 dark:bg-slate-800/40 dark:border-slate-700">
                    <h4 className="font-display font-bold text-sm text-primary flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-light text-teal-dark flex items-center justify-center text-xs font-bold">
                        {candidates.indexOf(c) + 1}
                      </span>
                      {c.applicant_name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ProgressBar label="Technical Skills" value={dims.technical} tone="teal" />
                      <ProgressBar label="Project & Applied Work" value={dims.projects} tone="purple" />
                      <ProgressBar label="Education Fit" value={dims.education} tone="emerald" />
                      <ProgressBar label="Experience Level" value={dims.experience} tone="amber" />
                      <ProgressBar label="Communication" value={dims.communication} tone="teal" />
                      <ProgressBar label="Culture Fit" value={dims.cultureFit} tone="emerald" />
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Consolidated Metric Comparison */}
            <section>
              <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber" />
                At a Glance
              </h3>
              <ComparisonMetric
                label="Match Score"
                highlight
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: analyses[c.id]?.match_score
                    ? `${analyses[c.id]?.match_score}%`
                    : null,
                }))}
              />
              <ComparisonMetric
                label="Recommendation"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: analyses[c.id]?.recommendation ?? "N/A",
                }))}
              />
            </section>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-card border border-border p-6 md:p-8 space-y-8"
          >
            <section>
              <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal" />
                Education & Background
              </h3>
              <ComparisonMetric
                label="University"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.university || analyses[c.id]?.parsed_resume?.education?.[0] || "N/A",
                }))}
              />
              <ComparisonMetric
                label="Degree"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.degree || "N/A",
                }))}
              />
              <ComparisonMetric
                label="CGPA"
                highlight
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.cgpa || analyses[c.id]?.parsed_resume?.cgpa || "N/A",
                }))}
              />
              <ComparisonMetric
                label="Experience"
                highlight
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: analyses[c.id]?.parsed_resume?.experience?.length
                    ? `${analyses[c.id]!.parsed_resume!.experience!.length} entries`
                    : "N/A",
                }))}
              />
              <ComparisonMetric
                label="Location"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.phone ? "Available" : "Not specified",
                }))}
              />
            </section>

            {/* Professional Links */}
            <section>
              <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-info" />
                Professional Links
              </h3>
              <ComparisonMetric
                label="LinkedIn"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.linkedin_url ? "✓ Available" : "—",
                }))}
              />
              <ComparisonMetric
                label="GitHub"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.github_url ? "✓ Available" : "—",
                }))}
              />
              <ComparisonMetric
                label="Portfolio"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  value: c.portfolio_url ? "✓ Available" : "—",
                }))}
              />
            </section>
          </motion.div>
        )}

        {/* SKILLS TAB */}
        {activeTab === "skills" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-card border border-border p-6 md:p-8 space-y-8"
          >
            <section>
              <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-teal" />
                Skills Comparison
              </h3>
              <ComparisonSkills
                label="Matched Skills"
                type="matched"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  skills: analyses[c.id]?.parsed_resume?.skills || [],
                }))}
              />
              <ComparisonSkills
                label="Missing Skills"
                type="missing"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  skills: analyses[c.id]?.missing_skills || [],
                }))}
              />
            </section>

            {/* Certifications */}
            <section>
              <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber" />
                Certifications
              </h3>
              <ComparisonSkills
                label="Certifications"
                type="matched"
                values={candidates.map((c) => ({
                  candidateId: c.id,
                  skills: analyses[c.id]?.parsed_resume?.certifications || [],
                }))}
              />
            </section>

            {/* Strengths & Weaknesses */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-sm text-emerald flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Strengths
                </h4>
                {candidates.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-emerald/30 bg-emerald-light/40 p-4 dark:bg-emerald/10 dark:border-emerald-400/25">
                    <p className="text-xs font-bold text-text-secondary mb-2">{c.applicant_name}</p>
                    {analyses[c.id]?.strengths?.length ? (
                      <ul className="space-y-1.5">
                        {analyses[c.id]!.strengths!.slice(0, 4).map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-text-muted italic">No data</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-sm text-rose flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> Weaknesses & Gaps
                </h4>
                {candidates.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-amber-300/40 bg-amber-50/50 p-4 dark:bg-amber-500/10 dark:border-amber-400/25">
                    <p className="text-xs font-bold text-text-secondary mb-2">{c.applicant_name}</p>
                    {analyses[c.id]?.weaknesses?.length ? (
                      <ul className="space-y-1.5">
                        {analyses[c.id]!.weaknesses!.slice(0, 4).map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-text-muted italic">No data</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-card border border-border p-6 md:p-8 space-y-8"
          >
            <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-ai" />
              Projects Comparison
            </h3>

            {/* Desktop: grid columns */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
              {candidates.map((c) => (
                <div key={c.id} className="space-y-3">
                  <h4 className="font-display font-bold text-sm text-primary flex items-center gap-2 border-b border-border pb-2">
                    <span className="w-5 h-5 rounded-full bg-purple-light text-purple-ai flex items-center justify-center text-[10px] font-bold">
                      {candidates.indexOf(c) + 1}
                    </span>
                    {c.applicant_name}
                  </h4>
                  {analyses[c.id]?.parsed_resume?.projects?.length ? (
                    <div className="space-y-3">
                      {analyses[c.id]!.parsed_resume!.projects!.map((proj, i) => (
                        <div key={i} className="rounded-xl border border-border bg-slate-50/50 p-3 hover:shadow-sm transition-shadow">
                          <p className="text-xs font-bold text-primary line-clamp-2">{proj}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-text-muted italic">No projects listed</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: accordion */}
            <div className="md:hidden space-y-4">
              {candidates.map((c) => (
                <details key={c.id} className="rounded-2xl border border-border overflow-hidden">
                  <summary className="p-4 bg-slate-50/50 font-display font-bold text-sm text-primary cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-2 dark:bg-slate-800/60 dark:hover:bg-slate-700/60">
                    <span className="w-5 h-5 rounded-full bg-purple-light text-purple-ai flex items-center justify-center text-[10px] font-bold">
                      {candidates.indexOf(c) + 1}
                    </span>
                    {c.applicant_name}
                  </summary>
                  <div className="p-4 space-y-3">
                    {analyses[c.id]?.parsed_resume?.projects?.length ? (
                      analyses[c.id]!.parsed_resume!.projects!.map((proj, i) => (
                        <div key={i} className="rounded-xl border border-border bg-slate-50/50 p-3">
                          <p className="text-xs font-medium text-text-primary">{proj}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted italic">No projects listed</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        )}

        {/* SCREENING ANSWERS TAB */}
        {activeTab === "answers" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-card border border-border p-6 md:p-8 space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-primary mb-6 border-b border-border/50 pb-2 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-teal" />
              Screening Answers
            </h3>
            <ComparisonAnswers
              answersByCandidate={answers}
              candidateIds={candidates.map((c) => c.id)}
            />
          </motion.div>
        )}

        {/* AI Reasoning Section */}
        {analyses && (
          <div className="mt-8 bg-white rounded-3xl shadow-card border border-border p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-display font-semibold text-primary border-b border-border/50 pb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-ai" />
              AI Reasoning & Candidate Summaries
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map((c) => {
                const reasoning = analyses[c.id]?.reasoning || analyses[c.id]?.parsed_resume?.summary || "No AI summary available.";
                return (
                  <div key={c.id} className="rounded-2xl border border-purple-ai/20 bg-purple-light/30 p-5 space-y-2 dark:bg-purple-ai/10 dark:border-purple-ai/30">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-ai text-white flex items-center justify-center text-[10px] font-bold">
                        {candidates.indexOf(c) + 1}
                      </span>
                      <h4 className="font-display font-bold text-sm text-primary">{c.applicant_name}</h4>
                      <Tag tone={getRecommendationTone(analyses[c.id]?.recommendation ?? "") as any} className="ml-auto">
                        {analyses[c.id]?.recommendation || "N/A"}
                      </Tag>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{reasoning}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
