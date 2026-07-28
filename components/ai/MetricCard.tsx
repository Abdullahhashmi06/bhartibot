"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  tone?: "teal" | "purple" | "emerald" | "amber" | "rose" | "blue" | "navy";
  className?: string;
  onClick?: () => void;
}

const toneMap = {
  teal: {
    bg: "bg-teal-light/60",
    border: "border-teal/30",
    iconBg: "bg-teal text-white",
    valueText: "text-teal-dark",
  },
  purple: {
    bg: "bg-purple-light/60",
    border: "border-purple-ai/30",
    iconBg: "bg-purple-ai text-white",
    valueText: "text-purple-ai",
  },
  emerald: {
    bg: "bg-emerald-light/60",
    border: "border-emerald/30",
    iconBg: "bg-emerald text-white",
    valueText: "text-emerald",
  },
  amber: {
    bg: "bg-amber-50/70",
    border: "border-amber-300/40",
    iconBg: "bg-warning text-white",
    valueText: "text-warning",
  },
  rose: {
    bg: "bg-red-50/70",
    border: "border-red-300/40",
    iconBg: "bg-danger text-white",
    valueText: "text-danger",
  },
  blue: {
    bg: "bg-blue-50/70",
    border: "border-blue-300/40",
    iconBg: "bg-info text-white",
    valueText: "text-info",
  },
  navy: {
    bg: "bg-white",
    border: "border-border",
    iconBg: "bg-primary text-white",
    valueText: "text-primary",
  },
};

export default function MetricCard({
  label,
  value,
  icon,
  trend,
  trendPositive = true,
  subtext,
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
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shadow-subtle shrink-0", styles.iconBg)}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("font-display font-extrabold text-3xl tracking-tight", styles.valueText)}>
          {value}
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
        <p className="mt-1.5 text-xs text-text-muted font-sans truncate">
          {subtext}
        </p>
      )}
    </motion.div>
  );
}
