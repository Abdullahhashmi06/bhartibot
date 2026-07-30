"use client";

import { useState } from "react";
import { Sparkles, Lightbulb, ChevronRight, ChevronDown, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RecruiterTips } from "@/lib/ai/assistant";

export default function RecruiterTips({
  title,
  field,
  requiredCount,
  preferredCount,
}: {
  title: string;
  field: string;
  requiredCount: number;
  preferredCount: number;
}) {
  const [tips, setTips] = useState<RecruiterTips | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const descriptionLength = 0; // simplified — we don't have full description access here

  async function handleGenerate() {
    if (!field) {
      setError("Select an industry field first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/recruiter-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Internship",
          field,
          requiredCount,
          preferredCount,
          descriptionLength,
        }),
      });
      const data = await res.json();
      setTips(data);
    } catch {
      setError("Tips could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-purple-ai/20 bg-gradient-card-glow shadow-subtle overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-purple-light/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-light text-purple-ai">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-purple-ai">AI Suggestions</span>
            {tips && (
              <span className="ml-2 text-[10px] text-text-muted font-mono">
                {tips.tips.length} tips
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!tips && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate();
              }}
              disabled={loading}
              className="rounded-lg p-1.5 text-purple-ai hover:bg-purple-ai/10 transition-colors"
              title="Generate tips"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {error && <p className="text-xs text-danger">{error}</p>}

              {!tips && !loading && (
                <div className="text-center py-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="text-xs text-purple-ai hover:underline font-semibold"
                  >
                    Generate AI suggestions
                  </button>
                  <p className="text-[10px] text-text-muted mt-1">
                    Get field-specific tips for your posting.
                  </p>
                </div>
              )}

              {loading && !tips && (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-3 animate-shimmer rounded-full" />
                  ))}
                </div>
              )}

              {tips && (
                <div className="space-y-2">
                  {tips.tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 rounded-xl border border-purple-ai/10 bg-white p-2.5"
                    >
                      <span className="shrink-0 mt-0.5">💡</span>
                      <p className="text-[11px] text-text-primary leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="text-[10px] text-text-muted hover:text-purple-ai underline transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
