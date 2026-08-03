"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  isPercentage?: boolean;
  showProgress?: boolean;
  tone?: "teal" | "purple" | "emerald" | "amber" | "rose" | "blue" | "navy";
  className?: string;
  onClick?: () => void;
}

const toneMap = {
  teal: {
    bg: "bg-teal-light/60 dark:bg-teal/10",
    border: "border-teal/30 dark:border-teal/30",
    iconBg: "bg-teal text-white",
    valueText: "text-teal-dark dark:text-teal-300",
  },
  purple: {
    bg: "bg-purple-light/60 dark:bg-purple-ai/10",
    border: "border-purple-ai/30 dark:border-purple-ai/30",
    iconBg: "bg-purple-ai text-white",
    valueText: "text-purple-ai dark:text-purple-300",
  },
  emerald: {
    bg: "bg-emerald-light/60 dark:bg-emerald/10",
    border: "border-emerald/30 dark:border-emerald/30",
    iconBg: "bg-emerald text-white",
    valueText: "text-emerald dark:text-emerald-300",
  },
  amber: {
    bg: "bg-amber-50/70 dark:bg-amber-500/10",
    border: "border-amber-300/40 dark:border-amber-400/30",
    iconBg: "bg-warning text-white",
    valueText: "text-warning dark:text-amber-300",
  },
  rose: {
    bg: "bg-red-50/70 dark:bg-red-500/10",
    border: "border-red-300/40 dark:border-red-400/30",
    iconBg: "bg-danger text-white",
    valueText: "text-danger dark:text-red-400",
  },
  blue: {
    bg: "bg-blue-50/70 dark:bg-blue-500/10",
    border: "border-blue-300/40 dark:border-blue-400/30",
    iconBg: "bg-info text-white",
    valueText: "text-info dark:text-blue-300",
  },
  navy: {
    bg: "bg-white dark:bg-slate-800/80",
    border: "border-border dark:border-slate-700",
    iconBg: "bg-primary text-white",
    valueText: "text-primary dark:text-white",
  },
};

export default function MetricCard({
  label,
  value,
  icon,
  trend,
  trendPositive = true,
  subtext,
  isPercentage = false,
  showProgress = false,
  tone = "navy",
  className,
  onClick,
}: MetricCardProps) {
  const styles = toneMap[tone];

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 10px 30px -4px rgba(11, 31, 58, 0.1)" }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-card transition-all duration-200 cursor-pointer select-none",
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-secondary dark:text-slate-300">
          {label}
        </span>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shadow-subtle shrink-0", styles.iconBg)}>
          {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("font-display font-extrabold text-3xl tracking-tight", styles.valueText)}>
          {typeof value === "number" ? (
            <AnimatedCounter value={value} format={isPercentage ? "percentage" : "number"} />
          ) : (
            value
          )}
        </span>
        {trend && (
          <span
            className={cn(
              "font-mono text-xs font-semibold px-2 py-0.5 rounded-full border",
              trendPositive
                ? "bg-emerald-light text-emerald border-emerald/20"
                : "bg-red-50 text-danger border-danger/20"
            )}
          >
            {trendPositive ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-text-muted dark:text-slate-400 font-sans truncate">
          {subtext}
        </p>
      )}

      {showProgress && typeof value === "number" && (
        <div className="absolute right-5 bottom-5">
          <svg className="h-10 w-10 transform -rotate-90">
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-700" />
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="currentColor" strokeWidth="4" className={styles.valueText} strokeDasharray="100" strokeDashoffset={100 - value} strokeLinecap="round" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
