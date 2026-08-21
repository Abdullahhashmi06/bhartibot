export default function SavedJobsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="animate-shimmer h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="animate-shimmer h-4 w-96 rounded-lg bg-slate-200 dark:bg-slate-700 mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-shimmer h-64 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}
