import { notFound } from "next/navigation";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import ApplicationForm from "@/components/applications/ApplicationForm";
import { createClient } from "@/lib/supabase/server";
import {
  getInternshipRequirements,
  getPublishedInternshipBySlug,
} from "@/lib/queries/internships";
import { getInternshipQuestions } from "@/lib/queries/questions";

export default async function ApplyPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const internship = await getPublishedInternshipBySlug(supabase, params.slug);

  if (!internship) {
    notFound();
  }

  const [requirements, questions] = await Promise.all([
    getInternshipRequirements(supabase, internship.id),
    getInternshipQuestions(supabase, internship.id),
  ]);

  const required = requirements.filter((r) => r.type === "required");
  const preferred = requirements.filter((r) => r.type === "preferred");

  return (
    <Shell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 py-4">
        <header className="flex flex-col gap-3">
          <Tag tone="teal">Open for applications</Tag>
          <h1 className="font-display text-2xl font-medium text-ink">
            {internship.title}
          </h1>
          <p className="text-sm text-muted">
            {[internship.field, internship.location, internship.work_mode, internship.duration]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </header>

        {internship.description && (
          <section>
            <h2 className="font-display text-sm font-medium text-ink">
              About this internship
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text">
              {internship.description}
            </p>
          </section>
        )}

        {(required.length > 0 || preferred.length > 0) && (
          <section className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
            <RequirementColumn title="Required" tone="amber" items={required} />
            <RequirementColumn
              title="Preferred"
              tone="teal"
              items={preferred}
            />
          </section>
        )}

        <section className="border-t border-border pt-6">
          <h2 className="font-display text-lg font-medium text-ink">
            Apply
          </h2>
          <p className="mt-1 text-sm text-muted">
            No account needed. Fill in your details and submit your application.
          </p>
          <div className="mt-6">
            <ApplicationForm
              internshipId={internship.id}
              slug={params.slug}
              questions={questions}
            />
          </div>
        </section>
      </div>
    </Shell>
  );
}

function RequirementColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "amber" | "teal";
  items: { id?: string; requirement: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-medium text-ink">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Tag key={item.id ?? item.requirement} tone={tone}>
            {item.requirement}
          </Tag>
        ))}
      </div>
    </div>
  );
}
