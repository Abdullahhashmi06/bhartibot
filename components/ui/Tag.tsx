import React from "react";
import { cn } from "@/lib/utils";

type Tone = "teal" | "amber" | "rose" | "purple" | "emerald" | "neutral" | "info";

const toneStyles: Record<Tone, string> = {
  teal: "bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal border-teal/20",
  amber: "bg-amber-50 dark:bg-amber/20 text-warning dark:text-amber-300 border-warning/20",
  rose: "bg-rose-50 dark:bg-rose/20 text-danger dark:text-rose-300 border-danger/20",
  purple: "bg-purple-light dark:bg-purple-ai/20 text-purple-ai dark:text-purple-300 border-purple-ai/20",
  emerald: "bg-emerald-light dark:bg-emerald/20 text-emerald dark:text-emerald-300 border-emerald/20",
  neutral: "bg-slate-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 border-slate-200 dark:border-slate-700",
  info: "bg-blue-50 dark:bg-blue/20 text-info dark:text-blue-300 border-info/20",
};

export default function Tag({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-medium uppercase tracking-wider border transition-colors",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        toneStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
