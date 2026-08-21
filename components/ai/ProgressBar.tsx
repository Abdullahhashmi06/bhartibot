"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  showPercentage?: boolean;
  tone?: "teal" | "purple" | "amber" | "emerald" | "rose";
  height?: "sm" | "md" | "lg";
  className?: string;
}

const toneGradients = {
  teal: "from-teal to-emerald",
  purple: "from-purple-ai to-teal",
  amber: "from-amber-400 to-amber-500",
  emerald: "from-emerald to-teal",
  rose: "from-rose-400 to-danger",
};

const heightStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  label,
  value,
  showPercentage = true,
  tone = "teal",
  height = "md",
  className,
}: ProgressBarProps) {
  const normalized = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-text-primary">
        <span>{label}</span>
        {showPercentage && (
          <span className="font-mono text-xs font-bold text-text-secondary">
            {normalized}%
          </span>
        )}
      </div>

      <div className={cn("w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700", heightStyles[height])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-subtle",
            toneGradients[tone]
          )}
        />
      </div>
    </div>
  );
}
