import Shell from "@/components/layout/Shell";

export default function ApplicantDetailLoading() {
  return (
    <Shell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="h-4 w-32 animate-pulse rounded bg-border" />
        <div className="border-b border-border pb-6">
          <div className="h-8 w-64 animate-pulse rounded bg-border" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-border" />
        </div>
        <div className="rounded-md border border-border bg-white p-5">
          <div className="h-4 w-full animate-pulse rounded bg-border" />
        </div>
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="font-display text-lg font-medium text-ink">
            AI Candidate Analysis
          </h2>
          <p className="text-sm text-muted">
            Running AI analysis — this may take a moment…
          </p>
        </section>
      </div>
    </Shell>
  );
}
