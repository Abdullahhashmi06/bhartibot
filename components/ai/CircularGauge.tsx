"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  /** Force a tone; when omitted the tone is derived from the score. */
  tone?: "teal" | "mint" | "indigo" | "navy" | "amber";
  className?: string;
  /** Hide the label entirely (for tiny rings / icon-only contexts). */
  hideLabel?: boolean;
}

/**
 * Premium circular progress ring.
 *
 * Layout contract (guarantees no text overflow):
 *  - The percentage is absolutely centered INSIDE the ring via a flex overlay
 *    that matches the ring's bounding box exactly.
 *  - The label is rendered BELOW the ring in normal flow, so long labels like
 *    "AI MATCH" or "ACCEPTANCE" can never clip against the arc.
 *  - Font size scales with ring size.
 *  - Tone always comes from the brand palette (emerald / teal / mint /
 *    indigo / navy). Lower scores are NOT shown in red.
 */
export default function CircularGauge({
  score,
  size = 140,
  strokeWidth = 10,
  label = "Match Score",
  tone,
  className,
  hideLabel = false,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Font scales with the ring so the number always fits inside.
  const valueSize =
    size >= 120
      ? "text-2xl sm:text-3xl"
      : size >= 84
      ? "text-lg sm:text-xl"
      : size >= 56
      ? "text-sm sm:text-base"
      : "text-xs";

  let gradientId = "gauge-teal";
  let textColor = "text-teal-dark dark:text-teal";

  switch (tone) {
    case "teal":
      gradientId = "gauge-teal";
      textColor = "text-teal-dark dark:text-teal";
      break;
    case "mint":
      gradientId = "gauge-mint";
      textColor = "text-emerald-dark dark:text-mint";
      break;
    case "indigo":
      gradientId = "gauge-indigo";
      textColor = "text-indigo-500 dark:text-indigo-300";
      break;
    case "navy":
      gradientId = "gauge-navy";
      textColor = "text-slate-600 dark:text-slate-300";
      break;
    case "amber":
      gradientId = "gauge-amber";
      textColor = "text-warning dark:text-amber-300";
      break;
    default: {
      // Brand-derived tone hierarchy — no red anywhere.
      if (score >= 80) {
        gradientId = "gauge-teal";
        textColor = "text-teal-dark dark:text-teal";
      } else if (score >= 60) {
        gradientId = "gauge-mint";
        textColor = "text-emerald-dark dark:text-mint";
      } else if (score >= 40) {
        gradientId = "gauge-indigo";
        textColor = "text-indigo-500 dark:text-indigo-300";
      } else {
        gradientId = "gauge-navy";
        textColor = "text-slate-600 dark:text-slate-300";
      }
    }
  }

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center select-none",
        className
      )}
    >
      {/* Ring + centered value — the overlay is a box of exactly `size` px,
          so the percentage is mathematically centered and never overflows. */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0 transform -rotate-90">
          <defs>
            <linearGradient id="gauge-teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#17C6B5" />
              <stop offset="100%" stopColor="#29D391" />
            </linearGradient>
            <linearGradient id="gauge-mint" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E8A6D" />
              <stop offset="100%" stopColor="#4EE0B8" />
            </linearGradient>
            <linearGradient id="gauge-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="gauge-navy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="gauge-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200/70 dark:text-slate-700"
          />

          {/* Progress Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Centered value */}
        <div className="absolute inset-0 flex items-center justify-center px-1">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={cn(
              "font-display font-extrabold tracking-tight leading-none text-center",
              valueSize,
              textColor
            )}
          >
            {normalizedScore}%
          </motion.span>
        </div>
      </div>

      {/* Label below the ring — can never overflow the circle. It is in
          normal flow, so it may be wider than the ring; centering keeps it
          balanced and it wraps naturally if extremely long. */}
      {label && !hideLabel && (
        <span className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-text-muted dark:text-slate-400 leading-snug text-center max-w-[10rem]">
          {label}
        </span>
      )}
    </div>
  );
}
