"use client";

import { useState, useCallback } from "react";
import { Sparkles, Copy, Check, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import type { InterviewQuestion } from "@/lib/ai/interview";

const difficultyColors: Record<string, string> = {
  Easy: "border-emerald/30 bg-emerald-light text-emerald",
  Medium: "border-amber/30 bg-amber-50 text-warning",
  Hard: "border-danger/30 bg-red-50 text-danger",
};

const categoryColors: Record<string, string> = {
  Technical: "border-blue-200 bg-blue-50 text-blue-700",
  Projects: "border-purple-200 bg-purple-light text-purple-ai",
  Behavioral: "border-teal/30 bg-teal-light text-teal-dark",
  "Problem Solving": "border-amber/30 bg-amber-50 text-warning",
  Communication: "border-emerald/30 bg-emerald-light text-emerald",
};

const groupLabels = [
  { key: "Easy", label: "Easy" },
  { key: "Medium", label: "Medium" },
  { key: "Hard", label: "Hard" },
  { key: "Technical", label: "Technical" },
  { key: "Projects", label: "Projects" },
  { key: "Behavioral", label: "Behavioral" },
  { key: "Problem Solving", label: "Problem Solving" },
  { key: "Communication", label: "Communication" },
];

export default function InterviewQuestionGenerator({
  applicationId,
  internshipId,
}: {
  applicationId: string;
  internshipId: string;
}) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string>("Easy");

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, internshipId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQuestions(data);
      }
    } catch {
      setError("Failed to generate interview questions.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, internshipId]);

  const handleCopy = useCallback(async (question: string, id: string) => {
    try {
      await navigator.clipboard.writeText(question);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroup((prev) => (prev === group ? "" : group));
  };

  return (
    <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-light text-purple-ai border border-purple-ai/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-primary">
              AI Interview Questions
            </h2>
            <p className="text-xs text-text-secondary">
              Personalized questions based on resume, requirements, and screening answers.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="gradient"
          size="sm"
          onClick={handleGenerate}
          isLoading={loading}
          leftIcon={<Sparkles className="h-4 w-4" />}
          className="shrink-0"
        >
          {questions.length > 0 ? "Regenerate" : "Generate Interview Questions"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-red-50 p-3 text-xs text-danger">
          {error}
        </div>
      )}

      {loading && questions.length === 0 && (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-shimmer rounded-2xl" />
          ))}
        </div>
      )}

      <AnimatePresence>
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Grouped by difficulty and category */}
            {groupLabels.map((group) => {
              const filtered = questions.filter(
                (q) =>
                  q.difficulty === group.key || q.category === group.key
              );
              if (filtered.length === 0) return null;

              const isExpanded = expandedGroup === group.key;

              return (
                <div key={group.key} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-2 rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-left transition-colors hover:bg-slate-100"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                    )}
                    <span className="font-display font-bold text-sm text-primary flex-1">
                      {group.label}
                    </span>
                    <Tag tone="neutral" className="text-[10px]">
                      {filtered.length} question{filtered.length !== 1 ? "s" : ""}
                    </Tag>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden pl-2"
                      >
                        {filtered.map((q, idx) => {
                          const uid = `${group.key}-${idx}`;
                          return (
                            <motion.div
                              key={uid}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="rounded-2xl border border-border bg-white p-4 shadow-subtle space-y-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-xs sm:text-sm text-text-primary leading-relaxed flex-1">
                                  {q.question}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(q.question, uid)}
                                  className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-slate-100 hover:text-teal-dark transition-colors"
                                  title="Copy question"
                                >
                                  {copiedId === uid ? (
                                    <Check className="h-3.5 w-3.5 text-emerald" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold font-mono ${
                                    difficultyColors[q.difficulty] ?? ""
                                  }`}
                                >
                                  {q.difficulty}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold font-mono ${
                                    categoryColors[q.category] ?? ""
                                  }`}
                                >
                                  {q.category}
                                </span>
                              </div>

                              {q.purpose && (
                                <p className="text-[10px] text-text-muted italic leading-relaxed">
                                  Purpose: {q.purpose}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
