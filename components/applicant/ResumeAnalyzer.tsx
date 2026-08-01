"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
  Wrench,
  RefreshCw,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ResumeFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  missing_elements: string[];
  recommended_skills: string[];
}

export default function ResumeAnalyzer({ hasCv }: { hasCv: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/ai/resume-analysis", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to analyze resume. Please try again.");
        setState("error");
        return;
      }
      setFeedback(data as ResumeFeedback);
      setState("done");
    } catch (e) {
      setError("Network error while analyzing your resume. Please try again.");
      setState("error");
    }
  }

  const scoreColor =
    (feedback?.score ?? 0) >= 80
      ? "text-emerald"
      : (feedback?.score ?? 0) >= 60
      ? "text-teal"
      : (feedback?.score ?? 0) >= 40
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal to-emerald text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-display font-bold text-primary dark:text-white">
          AI Resume Analysis
        </h2>
      </div>
      <p className="text-sm text-text-secondary dark:text-slate-400 mb-6 leading-relaxed">
        Get an instant AI review of your resume — a quality score, your
        strengths, what&apos;s missing, and concrete improvements to boost your
        chances with recruiters.
      </p>

      {!hasCv && state === "idle" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <CircleAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Upload a PDF resume above first, then return here to run the AI
            analysis.
          </p>
        </div>
      )}

      {state === "idle" && (
        <Button
          onClick={handleAnalyze}
          variant="gradient"
          disabled={!hasCv}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Analyze My Resume
        </Button>
      )}

      {state === "loading" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 text-teal animate-spin" />
          <p className="text-sm text-text-secondary animate-pulse">
            Parsing your resume with AI… this takes a few seconds.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-300/60 bg-rose-50 dark:bg-rose-500/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {error}
            </p>
          </div>
          <Button
            onClick={handleAnalyze}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Try Again
          </Button>
        </div>
      )}

      {state === "done" && feedback && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-5 p-5 rounded-2xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(feedback.score / 100) * 264} 264`}
                    className={scoreColor}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-display font-extrabold text-2xl ${scoreColor}`}>
                    {feedback.score}
                  </span>
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal" />
                  <span className="font-display font-bold text-sm text-primary dark:text-white">
                    Resume Quality Score
                  </span>
                </div>
                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                  {feedback.score >= 80
                    ? "Excellent — recruiters will find this resume compelling."
                    : feedback.score >= 60
                    ? "Good — a few improvements will make it stand out."
                    : feedback.score >= 40
                    ? "Fair — several improvements are recommended."
                    : "Needs work — apply the improvements below."}
                </p>
              </div>
            </div>

            {feedback.summary && (
              <p className="text-sm text-text-secondary dark:text-slate-400 leading-relaxed border-l-2 border-teal pl-4">
                {feedback.summary}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4">
              {feedback.strengths.length > 0 && (
                <FeedbackBlock
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />}
                  title="Strengths"
                  tone="emerald"
                  items={feedback.strengths}
                />
              )}
              {feedback.improvements.length > 0 && (
                <FeedbackBlock
                  icon={<Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                  title="Improvements"
                  tone="amber"
                  items={feedback.improvements}
                />
              )}
              {feedback.missing_elements.length > 0 && (
                <FeedbackBlock
                  icon={<AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
                  title="Missing Elements"
                  tone="rose"
                  items={feedback.missing_elements}
                />
              )}
              {feedback.recommended_skills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-teal shrink-0" />
                    <span className="font-semibold text-sm text-primary dark:text-white">
                      Recommended Skills
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {feedback.recommended_skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[11px] font-semibold bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal px-2.5 py-1 rounded-full border border-teal/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              <Button
                onClick={handleAnalyze}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Re-analyze
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function FeedbackBlock({
  icon,
  title,
  tone,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "emerald" | "amber" | "rose";
  items: string[];
}) {
  const tones = {
    emerald: "text-emerald",
    amber: "text-amber-500",
    rose: "text-rose-500",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-sm text-primary dark:text-white">
          {title}
        </span>
      </div>
      <ul className={`space-y-1.5 text-xs ${tones[tone]}`}>
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 leading-relaxed">
            <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-current" />
            <span className="text-text-secondary dark:text-slate-400">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
