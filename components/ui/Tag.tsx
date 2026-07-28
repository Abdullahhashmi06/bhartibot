import React from "react";
import { cn } from "@/lib/utils";

type Tone = "teal" | "amber" | "rose" | "purple" | "emerald" | "neutral" | "info";

const toneStyles: Record<Tone, string> = {
  teal: "bg-teal-light text-teal-dark border-teal/20",
  amber: "bg-amber-50 text-warning border-warning/20",
  rose: "bg-rose-50 text-danger border-danger/20",
  purple: "bg-purple-light text-purple-ai border-purple-ai/20",
  emerald: "bg-emerald-light text-emerald border-emerald/20",
  neutral: "bg-slate-100 text-text-secondary border-slate-200",
  info: "bg-blue-50 text-info border-info/20",
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
