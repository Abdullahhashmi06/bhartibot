"use client";

import { Sparkles, ArrowRight, ShieldCheck, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Tag from "@/components/ui/Tag";

interface RecommendationCardProps {
  recommendation: string;
  matchScore: number;
  reasoning?: string;
  interviewProbability?: number; // 0-100
  confidenceScore?: number; // 0-100
  onQuickAction?: (action: "shortlist" | "reject" | "under_review") => void;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  matchScore,
  reasoning,
  interviewProbability = Math.min(matchScore + 5, 98),
  confidenceScore = 94,
  onQuickAction,
  className,
}: RecommendationCardProps) {
  let recTone: "teal" | "purple" | "amber" | "rose" = "teal";
  if (recommendation.toLowerCase().includes("shortlist") || recommendation.toLowerCase().includes("highly")) {
    recTone = "teal";
  } else if (recommendation.toLowerCase().includes("consider") || recommendation.toLowerCase().includes("review")) {
    recTone = "amber";
  } else if (recommendation.toLowerCase().includes("reject") || recommendation.toLowerCase().includes("not")) {
    recTone = "rose";
  } else {
    recTone = "purple";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-purple-ai/20 bg-gradient-to-br from-white via-purple-light/20 to-teal-light/20 p-6 shadow-ai space-y-5",
        className
      )}
    >
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-text-primary">
              AI Hiring Decision & Synthesis
            </h3>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
              Powered by InternIQ AI Core
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag tone={recTone} className="px-3 py-1 text-xs">
            {recommendation}
          </Tag>
        </div>
      </div>

      {/* Probability Metrics Row */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-white/80 backdrop-blur p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
            <Award className="h-3.5 w-3.5 text-purple-ai" /> Interview Probability
          </div>
          <p className="font-display font-extrabold text-2xl text-purple-ai">
            {interviewProbability}%
          </p>
        </div>
        <div className="space-y-1 border-l border-border pl-4">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-teal" /> AI Confidence Level
          </div>
          <p className="font-display font-extrabold text-2xl text-teal-dark">
            {confidenceScore}%
          </p>
        </div>
      </div>

      {/* Summary Reasoning */}
      {reasoning && (
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            AI Executive Summary
          </span>
          <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-white/60 p-4 rounded-xl border border-slate-200/80">
            {reasoning}
          </p>
        </div>
      )}
    </motion.div>
  );
}
