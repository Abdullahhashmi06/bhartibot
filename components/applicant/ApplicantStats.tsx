"use client";

import { Briefcase, Bookmark, Clock, CheckCircle, XCircle, Video, Gift } from "lucide-react";

export default function ApplicantStats({ stats }: { stats: any }) {
  const statCards = [
    { label: "Total Applied", value: stats.total || 0, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Saved Jobs", value: stats.saved || 0, icon: Bookmark, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Under Review", value: stats.underReview || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Shortlisted", value: stats.shortlisted || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Rejected", value: stats.rejected || 0, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Interviews", value: stats.interviews || 0, icon: Video, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Offers", value: stats.offers || 0, icon: Gift, color: "text-cyan-500", bg: "bg-cyan-50" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
      {statCards.map((stat, i) => (
        <div key={i} className="bg-white p-4 sm:p-6 rounded-2xl shadow-card border border-border flex flex-col justify-center hover:border-teal/30 hover:shadow-hover transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">{stat.label}</p>
              <h3 className="text-xl font-bold text-primary">{stat.value}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
