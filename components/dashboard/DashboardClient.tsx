"use client";

import { useState, useMemo } from "react";
import { DashboardStats, ActivityItem, Internship } from "@/lib/types";
import MetricCard from "@/components/ai/MetricCard";
import RecruitmentFunnel from "./RecruitmentFunnel";
import WeeklyApplicationsChart from "./WeeklyApplicationsChart";
import AiDistributionChart from "./AiDistributionChart";
import TopUniversities from "./TopUniversities";
import SkillsCloud from "./SkillsCloud";
import ActivityFeed from "./ActivityFeed";
import InternshipFilters, { FilterState } from "./InternshipFilters";
import InternshipCard from "./InternshipCard";
import EmptyState from "./EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Users, Sparkles, CheckCircle2, XCircle, Clock } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

interface DashboardClientProps {
  stats: DashboardStats;
  internships: (Internship & { applicantCount: number, aiScoreAverage: number })[];
  recentActivity: ActivityItem[];
  topUniversities: { university: string; applicants: number; avgScore: number }[];
  topSkills: { skill: string; count: number }[];
  weeklyApplications: { name: string; count: number }[];
}

export default function DashboardClient({
  stats,
  internships,
  recentActivity,
  topUniversities,
  topSkills,
  weeklyApplications
}: DashboardClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tab: "Active",
    status: "",
    department: "",
    location: "",
    workMode: "",
    sortBy: "Newest"
  });

  /** True when an internship's application deadline has already passed. */
  const isDeadlinePassed = (i: Internship) =>
    i.deadline ? new Date(i.deadline).getTime() < Date.now() : false;

  // Extract unique values for filter dropdowns
  const departments = useMemo(() => Array.from(new Set(internships.map(i => i.field).filter(Boolean))) as string[], [internships]);
  const locations = useMemo(() => Array.from(new Set(internships.map(i => i.location).filter(Boolean))) as string[], [internships]);

  // Apply filters and sort
  const filteredInternships = useMemo(() => {
    return internships
      .filter(i => {
        const expired = isDeadlinePassed(i);

        // Tab filter — deadline-aware
        if (filters.tab === "Active") {
          if (i.status === "archived" || i.status === "closed" || expired) return false;
        }
        if (filters.tab === "Deadline Passed" && !expired) return false;
        if (filters.tab === "Draft" && i.status !== "draft") return false;
        if (filters.tab === "Published" && i.status !== "published") return false;
        if (filters.tab === "Archived" && i.status !== "archived" && i.status !== "closed") return false;
        
        // Dropdown filters
        if (filters.department && i.field !== filters.department) return false;
        if (filters.location && i.location !== filters.location) return false;
        if (filters.workMode && i.work_mode !== filters.workMode) return false;
        if (filters.status && i.status !== filters.status) return false;

        // Search text
        if (filters.search) {
          const s = filters.search.toLowerCase();
          const matchesTitle = i.title.toLowerCase().includes(s);
          const matchesField = i.field?.toLowerCase().includes(s);
          const matchesLocation = i.location?.toLowerCase().includes(s);
          if (!matchesTitle && !matchesField && !matchesLocation) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "Newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (filters.sortBy === "Oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (filters.sortBy === "Most Applications") return b.applicantCount - a.applicantCount;
        if (filters.sortBy === "Highest AI Score") return b.aiScoreAverage - a.aiScoreAverage;
        return 0;
      });
  }, [internships, filters]);

  const handleClearFilters = () => {
    setFilters({ ...filters, search: "", status: "", department: "", location: "", workMode: "" });
  };

  return (
    <div className="space-y-5">
      
      {/* TOP 6 METRICS SUMMARY GRID */}
      <Reveal variant="fade-up" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Total Roles"
          value={stats.activeInternships}
          icon={<Briefcase />}
          tone="navy"
          subtext="Currently Active"
        />
        <MetricCard
          label="Applications"
          value={stats.totalApplications}
          icon={<Users />}
          trend={stats.weeklyApplicationTrend !== null ? `${Math.abs(stats.weeklyApplicationTrend)}% this week` : undefined}
          trendPositive={stats.weeklyApplicationTrend !== null ? stats.weeklyApplicationTrend >= 0 : true}
          tone="teal"
        />
        <MetricCard
          label="Avg AI Score"
          value={stats.averageAiScore}
          isPercentage={true}
          showProgress={true}
          icon={<Sparkles />}
          tone="purple"
        />
        <MetricCard
          label="Shortlisted"
          value={stats.shortlistedApplications}
          icon={<CheckCircle2 />}
          tone="emerald"
        />
        <MetricCard
          label="Rejected"
          value={stats.rejectedApplications}
          icon={<XCircle />}
          tone="rose"
          trendPositive={false}
        />
        <MetricCard
          label="Pending Review"
          value={stats.newApplications + stats.underReviewApplications}
          icon={<Clock />}
          tone="amber"
          subtext={`${stats.newApplications} New`}
        />
      </Reveal>

      {/* HIRING FUNNEL */}
      <RecruitmentFunnel data={{
        total: stats.totalApplications,
        aiReviewed: stats.totalApplications - stats.newApplications,
        shortlisted: stats.shortlistedApplications,
        interview: stats.scheduledInterviews,
        offer: 0,
        hired: 0
      }} />

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <WeeklyApplicationsChart data={weeklyApplications} />
            <AiDistributionChart distribution={stats.scoreDistribution} />
          </div>
          
          <SkillsCloud skills={topSkills} />
        </div>

        {/* Right Column (Leaderboard & Activity) */}
        <div className="space-y-5">
          <TopUniversities universities={topUniversities} />
          <ActivityFeed activities={recentActivity} />
        </div>
      </div>

      {/* INTERNSHIP ROLES LIST */}
      <div className="space-y-3 pt-3 border-t border-border mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-primary">
              Your Internship Drives
            </h2>
            <p className="text-xs text-text-secondary">
              Manage requirements, view applicant pools, and publish public application URLs.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-text-muted">
            {filteredInternships.length} roles found
          </span>
        </div>

        <InternshipFilters 
          filters={filters} 
          setFilters={setFilters}
          departments={departments}
          locations={locations}
        />

        <div className="pt-2">
          {internships.length === 0 ? (
            <EmptyState variant="no-internships" />
          ) : filteredInternships.length === 0 ? (
            <EmptyState 
              variant={filters.tab === "Archived" ? "no-archived" : "no-results"} 
              onClearFilters={handleClearFilters} 
            />
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {filteredInternships.map(internship => (
                  <InternshipCard key={internship.id} internship={internship} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}
