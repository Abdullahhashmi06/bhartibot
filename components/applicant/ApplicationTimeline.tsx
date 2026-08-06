"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Each timeline stage has its OWN color identity (Applied, AI Screened, Viewed,
 * Shortlisted, Interview, Offer) so the progress tracker reads as a vibrant,
 * distinct journey instead of one flat color.
 */
const STAGES: {
  id: string;
  label: string;
  gradient: string;
  text: string;
  ring: string;
  shadow: string;
}[] = [
  {
    id: "applied",
    label: "Applied",
    gradient: "from-teal to-emerald-400",
    text: "text-teal-dark dark:text-teal",
    ring: "ring-teal/20",
    shadow: "shadow-teal",
  },
  {
    id: "ai_reviewed",
    label: "AI Screened",
    gradient: "from-indigo-500 to-violet-500",
    text: "text-indigo-600 dark:text-indigo-300",
    ring: "ring-indigo-500/25",
    shadow: "shadow-indigo-500/40",
  },
  {
    id: "viewed",
    label: "Viewed",
    gradient: "from-sky-500 to-blue-500",
    text: "text-sky-600 dark:text-sky-300",
    ring: "ring-sky-500/25",
    shadow: "shadow-sky-500/40",
  },
  {
    id: "shortlisted",
    label: "Shortlisted",
    gradient: "from-violet-500 to-purple-500",
    text: "text-violet-600 dark:text-violet-300",
    ring: "ring-violet-500/25",
    shadow: "shadow-violet-500/40",
  },
  {
    id: "interview",
    label: "Interview",
    gradient: "from-fuchsia-500 to-pink-500",
    text: "text-fuchsia-600 dark:text-fuchsia-300",
    ring: "ring-fuchsia-500/25",
    shadow: "shadow-fuchsia-500/40",
  },
  {
    id: "offer",
    label: "Offer",
    gradient: "from-amber-400 to-orange-500",
    text: "text-amber-600 dark:text-amber-300",
    ring: "ring-amber-500/25",
    shadow: "shadow-amber-500/40",
  },
];

export interface TimelineTheme {
  gradient: string; // "from-X to-Y" for the progress bar + completed node
  text: string; // completed label color
  ring: string; // ring color around completed node
  shadow: string; // glow shadow color
}

const DEFAULT_THEME: TimelineTheme = {
  gradient: "from-teal to-emerald-400",
  text: "text-teal",
  ring: "ring-teal/20",
  shadow: "shadow-teal",
};

export default function ApplicationTimeline({
  currentStatus,
  theme = DEFAULT_THEME,
}: {
  currentStatus: string;
  theme?: TimelineTheme;
}) {
  // Map internal status to index
  let currentIndex = 0;

  if (currentStatus === "rejected") {
    // Show rejected state
    return (
      <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-center gap-3 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center dark:bg-rose-500/20">
          <Clock className="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Application Not Selected</h4>
          <p className="text-xs mt-0.5">The company has decided to move forward with other candidates.</p>
        </div>
      </div>
    );
  }

  // Determine active stage index
  const statusMap: Record<string, number> = {
    "applied": 0,
    "under_review": 0, // treating as applied
    "ai_reviewed": 1,
    "viewed": 2,
    "shortlisted": 3,
    "interview": 4,
    "offer": 5,
    "hired": 5
  };

  currentIndex = statusMap[currentStatus] ?? 0;

  return (
    <div className="relative">
      {/* Connecting track + progress bar — aligned to node centers (desktop) */}
      <div className="absolute top-[20px] left-6 right-6 h-[2px] bg-slate-100 hidden md:block rounded-full"></div>

      {/* Active progress bar */}
      <div
        className={cn(
          "absolute top-[20px] left-6 h-[2px] bg-gradient-to-r hidden md:block transition-all duration-700 ease-in-out rounded-full",
          theme.gradient
        )}
        style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
      ></div>

      <div className="relative flex flex-col md:flex-row md:justify-between md:gap-3 gap-6 mt-4 md:mt-0 px-2 md:px-0">
        {STAGES.map((stage, i) => {
          const isCompleted = i <= currentIndex;
          const isActive = i === currentIndex;

          return (
            <div key={stage.id} className="flex md:flex-col items-center gap-3 md:gap-2 z-10 group flex-1 min-w-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                  isCompleted
                    ? cn("bg-gradient-to-br text-white ring-4 shadow-lg scale-110", stage.gradient, stage.shadow, stage.ring)
                    : "bg-slate-50 border-2 border-slate-200 text-slate-300 group-hover:border-teal/30 group-hover:bg-teal/5"
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5 animate-in zoom-in" /> : <Circle className="w-3 h-3 fill-current" />}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-semibold text-center leading-tight transition-colors",
                  isActive ? "text-primary font-bold" : isCompleted ? stage.text : "text-slate-400"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
