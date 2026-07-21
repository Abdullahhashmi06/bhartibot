import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";

export default function InternshipDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Tag tone="teal">Route wired · content pending</Tag>
        <h1 className="font-display text-2xl font-medium text-ink">
          Internship detail
        </h1>
        <p className="max-w-sm text-sm text-muted">
          This will show requirements, questions, the public application
          link, and submitted applications for{" "}
          <span className="font-mono text-xs text-ink">/{params.slug}</span>.
        </p>
      </div>
    </Shell>
  );
}
