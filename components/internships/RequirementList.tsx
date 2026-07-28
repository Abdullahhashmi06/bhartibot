"use client";

import { X, Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RequirementList({
  label,
  tone,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  tone: "amber" | "teal";
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const dotColor = tone === "amber" ? "bg-warning" : "bg-teal";

  function update(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, ""]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <span className="font-display font-bold text-sm text-text-primary">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add Requirement
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={item}
                placeholder={placeholder}
                onChange={(e) => update(i, e.target.value)}
                className="flex-1 rounded-xl border border-border bg-slate-50/50 px-3.5 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove item`}
                className="rounded-xl p-2 text-text-muted hover:bg-red-50 hover:text-danger transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
