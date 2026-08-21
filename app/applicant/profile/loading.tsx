export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile header skeleton */}
      <div className="animate-shimmer h-40 rounded-3xl bg-slate-200 dark:bg-slate-700" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="space-y-8">
          <div className="animate-shimmer h-64 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
