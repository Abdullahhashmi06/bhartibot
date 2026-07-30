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
import { Sparkles, Briefcase, MapPin, Clock } from "lucide-react";

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

  console.log("Internship ID:", internship.id);
  console.log("Questions:", questions);
  
  const required = requirements.filter((r) => r.type === "required");
  const preferred = requirements.filter((r) => r.type === "preferred");

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-8 py-8 px-4 sm:px-6">
        {/* PUBLIC APPLICATION HEADER */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Tag tone="teal">Open Internship Drive</Tag>
            <span className="font-mono text-xs text-text-muted font-medium">
              No account required
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
            {internship.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-text-secondary">
            {internship.field && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4 text-teal" /> {internship.field}
              </span>
            )}
            {internship.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-purple-ai" /> {internship.location}
              </span>
            )}
            {internship.work_mode && (
              <span className="bg-slate-100 px-2.5 py-0.5 rounded-full font-mono text-xs uppercase">
                {internship.work_mode}
              </span>
            )}
            {internship.duration && (
              <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                <Clock className="h-3.5 w-3.5" /> {internship.duration}
              </span>
            )}
          </div>

          {internship.description && (
            <div className="pt-4 border-t border-border space-y-1.5">
              <h2 className="font-display font-bold text-xs uppercase tracking-wider text-text-muted">
                About this Role
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-text-primary">
                {internship.description}
              </p>
            </div>
          )}
        </div>

        {/* REQUIREMENTS */}
        {(required.length > 0 || preferred.length > 0) && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <RequirementColumn title="Required Qualifications" tone="amber" items={required} />
            <RequirementColumn title="Preferred Competencies" tone="teal" items={preferred} />
          </div>
        )}

        {/* APPLICATION FORM */}
        <ApplicationForm
          internshipId={internship.id}
          slug={params.slug}
          questions={questions}
        />
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
    <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-3">
      <h3 className="font-display font-bold text-sm text-primary">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Tag key={item.id ?? item.requirement} tone={tone}>
            {item.requirement}
          </Tag>
        ))}
      </div>
    </div>
  );
}
