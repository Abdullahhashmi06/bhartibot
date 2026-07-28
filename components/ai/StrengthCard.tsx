"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrengthCardProps {
  title?: string;
  items: string[];
  className?: string;
}

export function StrengthCard({
  title = "Key Strengths",
  items,
  className,
}: StrengthCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald/30 bg-emerald-light/40 p-5 shadow-subtle space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald text-white shadow-subtle">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <h4 className="font-display text-sm font-semibold text-text-primary">
          {title}
        </h4>
        <span className="ml-auto font-mono text-[10px] font-bold text-emerald uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full border border-emerald/20">
          {items.length} Matched
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-text-primary leading-snug"
          >
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
