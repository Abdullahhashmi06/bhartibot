import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";

export default function CreateInternshipPage() {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Tag tone="amber">Coming Day 3</Tag>
        <h1 className="font-display text-2xl font-medium text-ink">
          Create Internship
        </h1>
        <p className="max-w-sm text-sm text-muted">
          The full form — title, field, description, work mode, and
          required/preferred requirements — gets built once the recruiter
          dashboard is connected to Supabase.
        </p>
      </div>
    </Shell>
  );
}
