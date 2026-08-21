export default function ApplicantDashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Hero skeleton */}
      <section className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-10 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="animate-shimmer h-6 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="animate-shimmer h-10 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="animate-shimmer h-4 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-shimmer h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          </div>
          <div className="shrink-0 mx-auto lg:mx-0">
            <div className="animate-shimmer h-40 w-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-shimmer h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-shimmer h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-shimmer h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </div>
  );
}
