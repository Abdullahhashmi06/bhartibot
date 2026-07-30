"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

interface FunnelData {
  total: number;
  aiReviewed: number;
  shortlisted: number;
  interview: number;
  offer: number;
  hired: number;
}

export default function RecruitmentFunnel({ data }: { data: FunnelData }) {
  const max = data.total || 1; // avoid div by 0

  const stages = [
    { label: "Applied", count: data.total, color: "bg-primary text-white" },
    { label: "AI Evaluated", count: data.aiReviewed, color: "bg-purple-ai text-white" },
    { label: "Shortlisted", count: data.shortlisted, color: "bg-emerald text-white" },
    { label: "Interview", count: data.interview, color: "bg-info text-white" },
    { label: "Offer", count: data.offer, color: "bg-warning text-white" },
    { label: "Hired", count: data.hired, color: "bg-teal-dark text-white" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-base text-primary">
            Recruitment Funnel
          </h3>
          <p className="text-xs text-text-secondary">
            Live pipeline across all stages.
          </p>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2"
      >
        {stages.map((stage, idx) => (
          <motion.div key={stage.label} variants={item} className="flex-1 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1 relative overflow-hidden group">
              <span className="font-mono text-[10px] uppercase font-bold text-text-muted">
                {stage.label}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-xl text-primary">
                  <AnimatedCounter value={stage.count} />
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white ${stage.color}`}>
                  {max > 0 ? Math.round((stage.count / max) * 100) : 0}%
                </span>
              </div>
              {/* Percentage bar background */}
              <div 
                className={`absolute bottom-0 left-0 h-1 ${stage.color} opacity-30`} 
                style={{ width: `${(stage.count / max) * 100}%` }}
              />
            </div>
            {idx < stages.length - 1 && (
              <div className="hidden sm:flex text-border shrink-0">
                <ChevronRight className="h-5 w-5" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
