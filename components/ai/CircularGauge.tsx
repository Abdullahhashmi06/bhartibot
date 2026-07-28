"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export default function CircularGauge({
  score,
  size = 140,
  strokeWidth = 10,
  label = "Match Score",
  className,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine tone color based on score
  let gradientId = "gauge-teal";
  let textColor = "text-teal";

  if (score >= 80) {
    gradientId = "gauge-teal";
    textColor = "text-teal-dark";
  } else if (score >= 60) {
    gradientId = "gauge-purple";
    textColor = "text-purple-ai";
  } else if (score >= 40) {
    gradientId = "gauge-amber";
    textColor = "text-warning";
  } else {
    gradientId = "gauge-rose";
    textColor = "text-danger";
  }

  return (
    <div className={cn("relative flex flex-col items-center justify-center select-none", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="gauge-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#17C6B5" />
            <stop offset="100%" stopColor="#29D391" />
          </linearGradient>
          <linearGradient id="gauge-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6F52ED" />
            <stop offset="100%" stopColor="#17C6B5" />
          </linearGradient>
          <linearGradient id="gauge-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="gauge-rose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-50"
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

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn("font-display font-extrabold text-3xl sm:text-4xl tracking-tight", textColor)}
        >
          {score}%
        </motion.span>
        {label && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-semibold mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
