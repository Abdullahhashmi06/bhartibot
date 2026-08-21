import Shell from "@/components/layout/Shell";

export default function SearchLoading() {
  return (
    <Shell>
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <div className="animate-shimmer h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="animate-shimmer h-4 w-80 rounded-lg bg-slate-200 dark:bg-slate-700 mt-2" />
        </div>
        <div className="animate-shimmer h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </Shell>
  );
}
