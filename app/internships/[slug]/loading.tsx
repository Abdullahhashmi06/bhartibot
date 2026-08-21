import Shell from "@/components/layout/Shell";

export default function InternshipDetailLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        <div className="border-b border-border pb-4">
          <div className="animate-shimmer h-4 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4">
          <div className="animate-shimmer h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-10 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-4 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="animate-shimmer h-32 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>

        <div className="animate-shimmer h-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </Shell>
  );
}
