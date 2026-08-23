"use client";

import { useQuery } from "@tanstack/react-query";
import ApplicationCard from "@/components/applicant/ApplicationCard";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Briefcase } from "lucide-react";

export default function ApplicationsClient({
  userId,
}: {
  userId: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["applicant-applications", userId],
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-applications");
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Show skeleton only when genuinely no cached data
  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <div>
          <div className="animate-shimmer h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-4 w-64 mt-2 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-shimmer h-36 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  const { applications } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">My Applications</h1>
        <p className="text-text-secondary mt-1">Track the status of your internship applications.</p>
      </div>

      <div className="space-y-6">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <ApplicationCard key={app.id} app={app} />
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center shadow-card border border-border dark:border-slate-700 flex flex-col items-center">
            <div className="w-16 h-16 bg-teal-light dark:bg-teal/15 text-teal-dark dark:text-teal rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-2">No Applications Yet</h2>
            <p className="text-text-secondary dark:text-slate-400 max-w-md mx-auto mb-6">
              You haven&apos;t applied to any internships yet. Explore available opportunities and start your journey!
            </p>
            <Link href="/applicant/internships">
              <Button variant="gradient">Find Internships</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
