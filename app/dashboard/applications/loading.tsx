import Shell from "@/components/layout/Shell";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ApplicationsLoading() {
  return (
    <Shell>
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <div className="h-4 w-32 animate-shimmer rounded bg-slate-200" />
          <div className="mt-2 h-10 w-80 animate-shimmer rounded bg-slate-200" />
          <div className="mt-1 h-4 w-64 animate-shimmer rounded bg-slate-200" />
        </div>
        <PageSkeleton />
      </div>
    </Shell>
  );
}
