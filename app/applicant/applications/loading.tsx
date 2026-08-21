export default function ApplicationsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="animate-shimmer h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="animate-shimmer h-4 w-80 rounded-lg bg-slate-200 dark:bg-slate-700 mt-2" />
      </div>

      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-shimmer h-36 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}
