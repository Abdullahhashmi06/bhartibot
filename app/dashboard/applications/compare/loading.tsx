import Shell from "@/components/layout/Shell";

export default function CompareLoading() {
  return (
    <Shell>
      <div className="space-y-6">
        <div className="animate-shimmer h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-96 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </Shell>
  );
}
