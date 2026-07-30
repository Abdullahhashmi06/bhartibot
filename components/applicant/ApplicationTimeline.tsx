"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "applied", label: "Applied" },
  { id: "ai_reviewed", label: "AI Screened" },
  { id: "viewed", label: "Viewed" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
];

export default function ApplicationTimeline({ currentStatus }: { currentStatus: string }) {
  // Map internal status to index
  let currentIndex = 0;
  
  if (currentStatus === "rejected") {
    // Show rejected state
    return (
      <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
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
      <div className="absolute top-[28px] left-6 right-6 h-[2px] bg-slate-100 hidden md:block rounded-full"></div>
      
      {/* Active progress bar */}
      <div 
        className="absolute top-[28px] left-6 h-[2px] bg-gradient-to-r from-teal to-emerald-400 hidden md:block transition-all duration-700 ease-in-out rounded-full" 
        style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
      ></div>

      <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0 mt-4 md:mt-0 px-2 md:px-0">
        {STAGES.map((stage, i) => {
          const isCompleted = i <= currentIndex;
          const isActive = i === currentIndex;
          
          return (
            <div key={stage.id} className="flex md:flex-col items-center gap-4 md:gap-3 z-10 group md:w-20">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                isCompleted 
                  ? "bg-gradient-to-br from-teal to-emerald-500 text-white shadow-teal ring-4 ring-teal/20 scale-110" 
                  : "bg-slate-50 border-2 border-slate-200 text-slate-300 group-hover:border-teal/30 group-hover:bg-teal/5"
              )}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5 animate-in zoom-in" /> : <Circle className="w-3 h-3 fill-current" />}
              </div>
              <span className={cn(
                "text-xs font-semibold md:absolute md:-bottom-7 md:whitespace-nowrap transition-colors text-left md:text-center w-full",
                isActive ? "text-primary font-bold scale-105 transition-transform" : isCompleted ? "text-teal" : "text-slate-400"
              )}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
