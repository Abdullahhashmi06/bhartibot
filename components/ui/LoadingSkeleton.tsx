import React from "react";
import { Skeleton } from "./Skeleton";

export function DashboardChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white dark:bg-slate-800 p-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-white dark:bg-slate-800 p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white dark:bg-slate-800 p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return <DashboardChartsSkeleton />;
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="animate-pulse space-y-6">
      {children || (
        <>
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </>
      )}
    </div>
  );
}
