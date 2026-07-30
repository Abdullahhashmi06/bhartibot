"use client";

import { useState } from "react";
import { Sparkles, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { ScreeningQuestionSuggestion } from "@/lib/ai/assistant";
import type { QuestionType } from "@/lib/types";

async function callScreeningQuestionAssistant(opts: {
  title: string;
  field: string;
  description: string;
  requirements: string[];
  currentQuestions: string[];
}): Promise<ScreeningQuestionSuggestion> {
  const res = await fetch("/api/ai/screening-question-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

const categoryConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  technical: { label: "Technical", color: "border-blue-200 bg-blue-50 text-blue-700", icon: "💻" },
  behavioral: { label: "Behavioral", color: "border-purple-200 bg-purple-50 text-purple-700", icon: "🧠" },
  problem_solving: { label: "Problem Solving", color: "border-amber-200 bg-amber-50 text-amber-700", icon: "🔍" },
  communication: { label: "Communication", color: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: "💬" },
  culture: { label: "Culture", color: "border-teal-200 bg-teal-light text-teal-dark", icon: "🤝" },
};

export default function ScreeningQuestionAssistant({
  title,
  field,
  description,
  requirements,
  currentQuestions,
  onAddQuestion,
}: {
  title: string;
  field: string;
  description: string;
  requirements: string[];
  currentQuestions: string[];
  onAddQuestion: (question: string, type: QuestionType) => void;
}) {
  const [suggestion, setSuggestion] = useState<ScreeningQuestionSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  async function handleSuggest() {
    setLoading(true);
    setError(null);

    try {
      const data = await callScreeningQuestionAssistant({
        title: title.trim(),
        field,
        description,
        requirements,
        currentQuestions,
      });
      setSuggestion(data);
    } catch {
      setError("AI suggestion failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(q: string) {
    if (added.has(q)) return;
    onAddQuestion(q, "TEXT");
    setAdded((prev) => new Set(prev).add(q));
  }

  function handleAddAll() {
    if (!suggestion) return;
    const all = [
      ...suggestion.technical,
      ...suggestion.behavioral,
      ...suggestion.problem_solving,
      ...suggestion.communication,
      ...suggestion.culture,
    ];
    all.forEach((q) => {
      if (!added.has(q)) {
        onAddQuestion(q, "TEXT");
        setAdded((prev) => new Set(prev).add(q));
      }
    });
  }

  const categories = suggestion
    ? ([
        { key: "technical", items: suggestion.technical },
        { key: "behavioral", items: suggestion.behavioral },
        { key: "problem_solving", items: suggestion.problem_solving },
        { key: "communication", items: suggestion.communication },
        { key: "culture", items: suggestion.culture },
      ] as const)
    : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSuggest}
          isLoading={loading}
          leftIcon={<Sparkles className="h-3.5 w-3.5 text-purple-ai" />}
          className="text-purple-ai border-purple-ai/30 hover:bg-purple-light"
        >
          ✨ Suggest Questions
        </Button>
        {suggestion && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddAll}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="text-teal-dark text-xs"
          >
            Add All
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {categories.map(({ key, items }) => {
              if (items.length === 0) return null;
              const cfg = categoryConfig[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-panel rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cfg.icon}</span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-mono ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {items.length} questions
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {items.map((q, i) => (
                      <div
                        key={i}
                        className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                          added.has(q)
                            ? "border-teal/40 bg-teal-light/40 opacity-70"
                            : "border-border bg-white hover:border-purple-ai/30 hover:bg-purple-light/30"
                        }`}
                      >
                        <p className="text-xs text-text-primary leading-relaxed flex-1">
                          {q}
                        </p>
                        {!added.has(q) ? (
                          <button
                            type="button"
                            onClick={() => handleAdd(q)}
                            className="shrink-0 rounded-lg border border-teal/30 bg-teal-light p-1 text-teal-dark hover:bg-teal transition-colors hover:text-white"
                            title="Add this question"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="shrink-0 rounded-lg bg-teal-light p-1 text-teal-dark">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
