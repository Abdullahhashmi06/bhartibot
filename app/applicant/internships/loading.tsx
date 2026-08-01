export default function InternshipsLoading() {
  return (
    <div className="space-y-10 pb-12">
      {/* Hero skeleton */}
      <div className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-10 shadow-card">
        <div className="flex gap-2 mb-4">
          <div className="animate-shimmer h-6 w-40 rounded-full" />
          <div className="animate-shimmer h-6 w-32 rounded-full" />
        </div>
        <div className="animate-shimmer h-10 w-3/4 rounded-xl mb-3" />
        <div className="animate-shimmer h-4 w-2/3 rounded-lg" />
        <div className="animate-shimmer h-4 w-1/2 rounded-lg mt-2" />
      </div>

      {/* Search skeleton */}
      <div className="animate-shimmer h-12 rounded-2xl" />

      {/* Recommended section skeleton */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="animate-shimmer h-7 w-64 rounded-lg" />
          <div className="animate-shimmer h-4 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 shadow-card"
            >
              <div className="flex gap-4 mb-4">
                <div className="animate-shimmer h-14 w-14 rounded-2xl" />
                <div className="flex-1">
                  <div className="animate-shimmer h-6 w-3/4 rounded-lg mb-2" />
                  <div className="animate-shimmer h-4 w-1/2 rounded-lg" />
                </div>
                <div className="animate-shimmer h-14 w-14 rounded-full" />
              </div>
              <div className="animate-shimmer h-4 w-full rounded-lg mb-2" />
              <div className="animate-shimmer h-4 w-5/6 rounded-lg mb-4" />
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="animate-shimmer h-6 w-20 rounded-md" />
                <div className="animate-shimmer h-6 w-24 rounded-md" />
                <div className="animate-shimmer h-6 w-16 rounded-md" />
              </div>
              <div className="border-t border-border pt-4 flex justify-end">
                <div className="animate-shimmer h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
