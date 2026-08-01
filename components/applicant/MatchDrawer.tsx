"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Check,
  TrendingUp,
  Target,
  GraduationCap,
  AlertTriangle,
  Lightbulb,
  Flame,
  Loader2,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import CircularGauge from "@/components/ai/CircularGauge";
import { Button } from "@/components/ui/Button";
import type { RecommendationResult } from "@/lib/ai/recommendations";

interface MatchDrawerProps {
  job: RecommendationResult | null;
  saved: boolean;
  applied: boolean;
  applying: boolean;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onApply: (job: RecommendationResult) => void;
}

export default function MatchDrawer({
  job,
  saved,
  applied,
  applying,
  onClose,
  onToggleSave,
  onApply,
}: MatchDrawerProps) {
  return (
    <AnimatePresence>
      {job && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* DRAWER */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto border-l border-border"
          >
            {/* HEADER */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-border px-6 py-4 flex items-start justify-between">
              <div className="pr-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal-dark dark:text-teal mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Why This Match?
                </p>
                <h2 className="font-display font-extrabold text-xl text-primary dark:text-white leading-tight">
                  {job.title}
                </h2>
                <p className="text-sm text-text-secondary">{job.company_name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* SCORE RINGS */}
              <div className="flex items-center justify-around rounded-2xl border border-border bg-slate-50/60 dark:bg-slate-800/60 px-4 py-5">
                <CircularGauge score={job.matchScore} size={104} strokeWidth={8} label="AI Match" />
                <div className="h-16 w-px bg-border" />
                <CircularGauge
                  score={job.acceptanceProbability}
                  size={104}
                  strokeWidth={8}
                  label="Acceptance"
                  tone="mint"
                />
              </div>

              {/* AI EXPLANATION */}
              {job.explanation && (
                <div
                  className={`flex items-start gap-2.5 rounded-2xl border p-4 text-sm leading-relaxed ${
                    job.aiGenerated
                      ? "bg-teal-light/70 dark:bg-teal/10 border-teal/25 text-teal-dark dark:text-teal-light"
                      : "bg-slate-50 dark:bg-slate-800 border-border text-text-secondary dark:text-slate-300"
                  }`}
                >
                  <Sparkles
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      job.aiGenerated ? "text-teal-dark dark:text-teal" : "text-teal"
                    }`}
                  />
                  <span>{job.explanation}</span>
                </div>
              )}

              {/* COMPETITION */}
              <div className="rounded-2xl border border-border p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-teal" /> Competition Level
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      job.competitionIntelligence.tone === "emerald"
                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                        : job.competitionIntelligence.tone === "amber"
                        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                        : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
                    }`}
                  >
                    {job.competitionIntelligence.dot} {job.competitionIntelligence.label}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {job.applicant_count} applicant{job.applicant_count !== 1 ? "s" : ""} applied
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-mint-light dark:bg-mint/10 border border-mint/30 px-2.5 py-1 text-xs font-semibold text-emerald-dark dark:text-mint">
                    <Target className="h-3 w-3" /> Est. difficulty:{" "}
                    {job.competitionIntelligence.estimatedDifficulty}
                  </span>
                  {job.competitionIntelligence.avgApplicantMatch != null && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-border px-2.5 py-1 text-xs text-text-secondary">
                      Avg applicant match: {job.competitionIntelligence.avgApplicantMatch}%
                    </span>
                  )}
                </div>
              </div>

              {/* SKILLS */}
              <div className="rounded-2xl border border-border p-4 space-y-4">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Skills You Already Have
                  </h3>
                  {job.matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {job.matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-medium"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No matching skills yet.</p>
                  )}
                </div>

                {/* SKILL GAPS */}
                {job.skillGaps.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> Skills You Should Learn
                    </h3>
                    <div className="space-y-2">
                      {job.skillGaps.map((gap, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 dark:border-amber-500/25 bg-amber-50/50 dark:bg-amber-500/5 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 truncate">
                              Learn {gap.skill}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700/80 dark:text-amber-400/80">
                              {gap.priority} priority
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              +{gap.matchGain}% match
                            </p>
                            <p className="text-[10px] text-teal-dark dark:text-mint">
                              +{gap.acceptanceGain}% acceptance
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STRENGTHS */}
              {job.strengths.length > 0 && (
                <div className="rounded-2xl border border-border p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-teal-dark dark:text-teal mb-2 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Resume Strengths
                  </h3>
                  <ul className="space-y-1.5">
                    {job.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
                        <Check className="h-3.5 w-3.5 text-teal shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* WEAKNESSES */}
              {job.weaknesses.length > 0 && (
                <div className="rounded-2xl border border-border p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Areas To Strengthen
                  </h3>
                  <ul className="space-y-1.5">
                    {job.weaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
                        <AlertTriangle className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SUGGESTED IMPROVEMENTS */}
              {job.skillGaps.length > 0 && (
                <div className="rounded-2xl border border-teal/25 dark:border-teal/30 bg-teal-light/50 dark:bg-teal/5 p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-teal-dark dark:text-teal mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Suggested Improvements
                  </h3>
                  <p className="text-xs text-emerald-dark/90 dark:text-teal-light/90 leading-relaxed">
                    Learning {job.skillGaps.slice(0, 2).map((g) => g.skill).join(" and ")} could
                    raise your match by up to{" "}
                    {job.skillGaps.slice(0, 2).reduce((sum, g) => sum + g.matchGain, 0)}% and your
                    estimated acceptance by up to{" "}
                    {job.skillGaps.slice(0, 2).reduce((sum, g) => sum + g.acceptanceGain, 0)}% — the
                    highest-impact steps for this role.
                  </p>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="flex items-center gap-3 pt-2 pb-8">
                <button
                  onClick={() => onToggleSave(job.id)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    saved
                      ? "bg-teal/10 border-teal/30 text-teal"
                      : "border-border text-slate-400 hover:text-teal hover:border-teal/30"
                  }`}
                  aria-label="Save job"
                >
                  <Bookmark className={`h-5 w-5 ${saved ? "fill-teal" : ""}`} />
                </button>
                {applied ? (
                  <Button variant="secondary" disabled className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <Check className="h-4 w-4 mr-1" /> Applied
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={() => onApply(job)}
                    disabled={applying}
                    rightIcon={
                      job.public_slug ? (
                        <ExternalLink className="h-4 w-4" />
                      ) : applying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : undefined
                    }
                  >
                    {applying ? "Applying..." : "Apply Now"}
                  </Button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
