"use client";

import { QuestionType } from "@/lib/types";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Tag from "@/components/ui/Tag";

interface Question {
  question: string;
  type: QuestionType;
}

export default function QuestionList({
  items,
  onChange,
}: {
  items: Question[];
  onChange: (items: Question[]) => void;
}) {
  function updateQuestion(index: number, value: string) {
    const next = [...items];
    next[index].question = value;
    onChange(next);
  }

  function updateType(index: number, value: QuestionType) {
    const next = [...items];
    next[index].type = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...items,
      {
        question: "",
        type: "TEXT",
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-text-primary flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-teal" /> Screening Questions ({items.length})
        </h3>

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add Question
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border border-border bg-slate-50/50 p-4 space-y-3 shadow-subtle"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-text-muted">
                  Q{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      updateType(index, e.target.value as QuestionType)
                    }
                    className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-medium text-text-primary focus:border-teal focus:outline-none"
                  >
                    <option value="TEXT">Free-Text Answer</option>
                    <option value="YES_NO">Yes / No Binary</option>
                  </select>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 text-text-muted hover:text-danger transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={item.question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder="Enter custom screening question..."
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-text-primary focus:border-teal focus:outline-none"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}