export default function TalentPoolLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <div className="animate-shimmer h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-4 w-80 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="animate-shimmer h-8 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-shimmer h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}
