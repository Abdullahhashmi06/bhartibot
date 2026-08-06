"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, TrendingUp, Lightbulb, GraduationCap } from "lucide-react";

export interface AiInsightsData {
  /** e.g. "AI and Software Engineering" */
  topFields: string;
  /** e.g. "Docker" — the highest-impact skill gap */
  topGapSkill: string | null;
  /** estimated average acceptance gain if the gap is closed */
  gapBoost: number | null;
  /** e.g. "Remote" — work mode with the best average acceptance */
  bestWorkMode: string | null;
  /** strongest matched skills (3) */
  strengths: string[];
  /** true when the applicant has enough profile signal for insights */
  hasSignal: boolean;
}

export default function AiInsightsCard({ data }: { data: AiInsightsData }) {
  if (!data.hasSignal) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white dark:bg-slate-800 p-6 shadow-card">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-teal-light dark:bg-teal/15 text-teal-dark dark:text-teal">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary dark:text-white">
            AI Insights
          </h3>
        </div>
        <p className="text-sm text-text-secondary dark:text-slate-400 leading-relaxed">
          Complete your profile with skills and projects and InternIQ will analyze
          your strengths to help you target the right internships.
        </p>
      </div>
    );
  }

  const insights: { icon: React.ReactNode; text: string }[] = [];
  if (data.topFields) {
    insights.push({
      icon: <Target className="h-4 w-4 text-teal-dark dark:text-teal" />,
      text: `Your profile matches ${data.topFields} roles best.`,
    });
  }
  if (data.topGapSkill && data.gapBoost != null) {
    insights.push({
      icon: <TrendingUp className="h-4 w-4 text-emerald-dark dark:text-emerald" />,
      text: `Improving ${data.topGapSkill} could increase your average acceptance probability by ~${data.gapBoost}%.`,
    });
  }
  if (data.bestWorkMode) {
    insights.push({
      icon: <Lightbulb className="h-4 w-4 text-warning" />,
      text: `${data.bestWorkMode} internships currently offer your highest acceptance chance.`,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-br from-teal-light/50 via-white to-emerald-light/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 sm:p-7 shadow-card"
    >
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-teal">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-primary dark:text-white">
              AI Insights
            </h3>
            <p className="text-[11px] text-text-muted dark:text-slate-400">
              Generated from your profile &amp; live competition data
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              className="flex items-start gap-3 rounded-2xl border border-border dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 py-3"
            >
              <span className="mt-0.5 shrink-0">{insight.icon}</span>
              <p className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">
                {insight.text}
              </p>
            </motion.div>
          ))}
        </div>

        {data.strengths.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-teal" /> Your strongest strengths
            </p>
            <div className="flex flex-wrap gap-2">
              {data.strengths.map((s, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1.5 rounded-xl bg-emerald-light dark:bg-emerald/15 text-emerald-dark dark:text-emerald border border-emerald/15 font-semibold"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
