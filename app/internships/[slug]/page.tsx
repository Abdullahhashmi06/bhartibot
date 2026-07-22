import { notFound, redirect } from "next/navigation";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import { createClient } from "@/lib/supabase/server";
import {
  getInternshipBySlug,
  getInternshipRequirements,
} from "@/lib/queries/internships";

export default async function InternshipDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const internship = await getInternshipBySlug(supabase, params.slug);
  if (!internship) {
    notFound();
  }

  const requirements = await getInternshipRequirements(supabase, internship.id);
  const required = requirements.filter((r) => r.type === "required");
  const preferred = requirements.filter((r) => r.type === "preferred");

  return (
    <Shell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
        <div>
          <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
            {internship.status}
          </Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            {internship.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {internship.field} · {internship.location}
            {internship.work_mode ? ` · ${internship.work_mode}` : ""}
            {internship.duration ? ` · ${internship.duration}` : ""}
          </p>
        </div>

        {internship.description && (
          <p className="text-sm leading-relaxed text-text">
            {internship.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <RequirementColumn title="Required" tone="amber" items={required} />
          <RequirementColumn title="Preferred" tone="teal" items={preferred} />
        </div>

        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
          Publishing, the public application link, and submitted applications
          land in the next milestone (Days 4–7).
        </div>
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
        {items.length === 0 ? (
          <span className="text-sm text-muted">None added</span>
        ) : (
          items.map((item) => (
            <Tag key={item.id ?? item.requirement} tone={tone}>
              {item.requirement}
            </Tag>
          ))
        )}
      </div>
    </div>
  );
}
