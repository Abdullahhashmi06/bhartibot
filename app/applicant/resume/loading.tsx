export default function ResumeLoading() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="animate-shimmer h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="animate-shimmer h-4 w-96 rounded-lg bg-slate-200 dark:bg-slate-700 mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="animate-shimmer h-64 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-80 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-8">
          <div className="animate-shimmer h-64 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
