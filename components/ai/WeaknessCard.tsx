"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeaknessCardProps {
  title?: string;
  items: string[];
  className?: string;
}

export function WeaknessCard({
  title = "Weaknesses & Gaps",
  items,
  className,
}: WeaknessCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-300/40 bg-amber-50/50 p-5 shadow-subtle space-y-3 dark:bg-amber-500/10 dark:border-amber-400/25",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning text-white shadow-subtle">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <h4 className="font-display text-sm font-semibold text-text-primary">
          {title}
        </h4>
        <span className="ml-auto font-mono text-[10px] font-bold text-warning uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full border border-amber-200 dark:bg-slate-800 dark:border-amber-400/30">
          {items.length} Concerns
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-text-primary leading-snug"
          >
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
