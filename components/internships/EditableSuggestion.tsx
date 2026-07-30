"use client";

import { Sparkles, Check, X, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface EditableSuggestionProps {
  children: React.ReactNode;
  onAccept: () => void;
  onEdit?: () => void;
  onIgnore: () => void;
  confidence?: "high" | "medium" | "low";
  /** Show a top-level "AI Suggested" label */
  showLabel?: boolean;
}

const confidenceConfig = {
  high: { label: "High Confidence", color: "text-emerald bg-emerald-light border-emerald/20" },
  medium: { label: "Medium Confidence", color: "text-warning bg-amber-50 border-amber/20" },
  low: { label: "Low Confidence", color: "text-text-muted bg-slate-100 border-border" },
};

export default function EditableSuggestion({
  children,
  onAccept,
  onEdit,
  onIgnore,
  confidence = "medium",
  showLabel = true,
}: EditableSuggestionProps) {
  const cfg = confidenceConfig[confidence];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 border-l-4 border-l-purple-ai/60"
    >
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-light text-purple-ai">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-bold text-xs text-purple-ai">
              AI Suggested
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${cfg.color}`}
          >
            {cfg.label}
          </span>
        </div>
      )}

      <div className="text-xs sm:text-sm text-text-primary leading-relaxed">
        {children}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          variant="gradient"
          size="sm"
          onClick={onAccept}
          leftIcon={<Check className="h-3.5 w-3.5" />}
        >
          Accept
        </Button>

        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            leftIcon={<Edit3 className="h-3.5 w-3.5" />}
          >
            Edit
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onIgnore}
          leftIcon={<X className="h-3.5 w-3.5" />}
          className="text-text-muted hover:text-danger"
        >
          Ignore
        </Button>
      </div>
    </motion.div>
  );
}
