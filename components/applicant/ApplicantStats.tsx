"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Bookmark,
  Clock,
  CheckCircle,
  XCircle,
  Video,
  Gift,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export default function ApplicantStats({ stats }: { stats: any }) {
  const statCards = [
    {
      label: "Total Applied",
      value: stats.total || 0,
      icon: Briefcase,
      tile: "bg-teal-light text-teal-dark dark:bg-teal/15 dark:text-teal",
      accent: "text-teal-dark dark:text-teal",
      trend: stats.total > 0 ? "Applications submitted" : "Start applying",
      trendUp: stats.total > 0,
    },
    {
      label: "Saved Jobs",
      value: stats.saved || 0,
      icon: Bookmark,
      tile: "bg-emerald-light text-emerald-dark dark:bg-emerald/15 dark:text-emerald",
      accent: "text-emerald-dark dark:text-emerald",
      trend: stats.saved > 0 ? "Bookmarked for later" : "Save opportunities",
      trendUp: stats.saved > 0,
    },
    {
      label: "Under Review",
      value: stats.underReview || 0,
      icon: Clock,
      tile: "bg-amber-50 text-warning dark:bg-amber-500/15 dark:text-amber-300",
      accent: "text-warning dark:text-amber-300",
      trend: stats.underReview > 0 ? "Being evaluated by AI" : "Awaiting review",
      trendUp: stats.underReview > 0,
    },
    {
      label: "Shortlisted",
      value: stats.shortlisted || 0,
      icon: CheckCircle,
      tile: "bg-mint-light text-emerald-dark dark:bg-mint/15 dark:text-mint",
      accent: "text-emerald-dark dark:text-mint",
      trend: stats.shortlisted > 0 ? "Great progress!" : "Keep pushing",
      trendUp: stats.shortlisted > 0,
    },
    {
      label: "Interviews",
      value: stats.interviews || 0,
      icon: Video,
      tile: "bg-teal-light text-teal-dark dark:bg-teal/15 dark:text-teal",
      accent: "text-teal-dark dark:text-teal",
      trend: stats.interviews > 0 ? "Scheduled" : "Upcoming",
      trendUp: stats.interviews > 0,
    },
    {
      label: "Offers",
      value: stats.offers || 0,
      icon: Gift,
      tile: "bg-emerald-light text-emerald-dark dark:bg-emerald/15 dark:text-emerald",
      accent: "text-emerald-dark dark:text-emerald",
      trend: stats.offers > 0 ? "Congratulations! 🎉" : "Working on it",
      trendUp: stats.offers > 0,
    },
    {
      label: "Rejected",
      value: stats.rejected || 0,
      icon: XCircle,
      tile: "bg-rose-50 text-danger dark:bg-rose-500/15 dark:text-rose-300",
      accent: "text-danger dark:text-rose-300",
      trend: stats.rejected > 0 ? "Opportunity to improve" : "No rejections",
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
      {statCards.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.35 }}
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-card border border-border flex flex-col gap-3 hover:border-teal/30 hover:shadow-hover transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${stat.tile}`}>
              <stat.icon className="h-[18px] w-[18px]" />
            </div>
            {stat.trendUp ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-dark dark:text-emerald">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            )}
          </div>
          <div>
            <p className={`text-2xl font-display font-extrabold ${stat.accent}`}>
              {stat.value}
            </p>
            <p className="text-[11px] font-semibold text-text-secondary dark:text-slate-400 mt-0.5">
              {stat.label}
            </p>
            <p className="text-[10px] text-text-muted dark:text-slate-500 mt-0.5 truncate">
              {stat.trend}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
