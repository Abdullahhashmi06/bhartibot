"use client";

import { motion } from "framer-motion";
import { ActivityItem } from "@/lib/types";
import { FileText, Sparkles, CheckCircle2, Megaphone, Clock } from "lucide-react";
import Link from "next/link";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  function getIcon(type: string) {
    switch (type) {
      case "application": return <FileText className="h-4 w-4 text-primary" />;
      case "ai_analysis": return <Sparkles className="h-4 w-4 text-purple-ai" />;
      case "shortlisted": return <CheckCircle2 className="h-4 w-4 text-emerald" />;
      case "internship_published": return <Megaphone className="h-4 w-4 text-teal" />;
      default: return <Clock className="h-4 w-4 text-text-secondary" />;
    }
  }

  function getBg(type: string) {
    switch (type) {
      case "application": return "bg-slate-100 border-slate-200";
      case "ai_analysis": return "bg-purple-light border-purple-ai/20";
      case "shortlisted": return "bg-emerald-light border-emerald/20";
      case "internship_published": return "bg-teal-light border-teal/20";
      default: return "bg-slate-50 border-slate-200";
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-primary">
          Recent Activity
        </h3>
        <p className="text-xs text-text-secondary">
          Latest updates across your roles.
        </p>
      </div>

      <div className="relative pt-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
        
        {activities.length === 0 ? (
          <div className="text-center py-6 text-sm text-text-muted">
            No recent activity.
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4 relative z-10 pr-2"
          >
            {activities.map((activity) => (
              <motion.div key={activity.id} variants={item} className="flex gap-4 group">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${getBg(activity.type)}`}>
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0 pt-1.5 pb-2 border-b border-transparent group-hover:border-slate-100 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {activity.title}
                    </p>
                    <span className="text-[10px] font-mono text-text-muted whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {activity.description}
                  </p>
                  {activity.link && (
                    <Link href={activity.link} className="inline-block mt-2 text-xs font-medium text-teal hover:text-teal-dark transition-colors">
                      View details &rarr;
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
