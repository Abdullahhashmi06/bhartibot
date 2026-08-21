import Shell from "@/components/layout/Shell";

export default function InternshipApplicantsLoading() {
  return (
    <Shell>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <div className="animate-shimmer h-4 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="space-y-1">
          <div className="animate-shimmer h-8 w-80 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-4 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>

        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-shimmer h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </Shell>
  );
}
