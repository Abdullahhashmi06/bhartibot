import Shell from "@/components/layout/Shell";
import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <Shell>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="border-b border-border pb-8">
          <div className="h-4 w-32 animate-shimmer rounded bg-slate-200" />
          <div className="mt-3 h-10 w-96 animate-shimmer rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-shimmer rounded bg-slate-200" />
        </div>
        
        <DashboardSkeleton />
      </div>
    </Shell>
  );
}