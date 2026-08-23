"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, PlusCircle } from "lucide-react";
import Tag from "@/components/ui/Tag";
import { ButtonLink } from "@/components/ui/Button";
import DashboardClient from "@/components/dashboard/DashboardClient";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";

export default function RecruiterDashboardClient({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recruiter-dashboard", userId],
    queryFn: async () => {
      const res = await fetch("/api/data/recruiter-dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Show error state if the query failed
  if (isError && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary">Failed to load dashboard data.</p>
        <p className="text-sm text-text-muted mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  // Show skeleton only when there is genuinely no cached data (first visit)
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-8">
          <div className="h-4 w-32 animate-shimmer rounded bg-slate-200" />
          <div className="mt-3 h-10 w-96 animate-shimmer rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-shimmer rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-shimmer rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 animate-shimmer rounded-2xl bg-slate-200" />
          <div className="h-48 animate-shimmer rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  const {
    stats,
    recentActivity,
    topUniversities,
    topSkills,
    internships: analyticsInternships,
    applicationsCountByInternship,
    weeklyApplications,
    orgResolved,
  } = data;

  let internships = analyticsInternships || [];
  let counts = applicationsCountByInternship || {};

  const internshipsWithData = internships.map((internship: any) => ({
    ...internship,
    applicantCount: counts[internship.id] ?? 0,
    aiScoreAverage: stats?.aiScoresByInternship?.[internship.id] ?? 0,
  }));

  const fullName = data.userName || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Tag tone="teal">Recruiter Workspace</Tag>
          </div>
          <h1 className="mt-2 font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-primary">
            Welcome back{fullName ? `, ${fullName}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {userEmail} · Managing {stats?.activeInternships || 0} active internship recruitment drives.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/dashboard/applications" variant="secondary" leftIcon={<Users className="h-4 w-4" />}>
            All Applications
          </ButtonLink>
          <ButtonLink href="/dashboard/create-internship" variant="gradient" leftIcon={<PlusCircle className="h-4 w-4" />}>
            Create Internship
          </ButtonLink>
        </div>
      </div>

      <NotificationsPanel />

      <DashboardClient
        stats={stats}
        internships={internshipsWithData}
        recentActivity={recentActivity}
        topUniversities={topUniversities}
        topSkills={topSkills}
        weeklyApplications={weeklyApplications}
      />
    </div>
  );
}
