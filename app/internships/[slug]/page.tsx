import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Edit3, Users, Briefcase } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import ScreeningQuestions from "@/components/internships/ScreeningQuestions";
import PublishPanel from "@/components/internships/PublishPanel";
import { createClient } from "@/lib/supabase/server";
import {
  getInternshipBySlug,
  getInternshipRequirements,
} from "@/lib/queries/internships";
import { getInternshipQuestions } from "@/lib/queries/questions";

export const dynamic = "force-dynamic";

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

  const [requirements, questions] = await Promise.all([
    getInternshipRequirements(supabase, internship.id),
    getInternshipQuestions(supabase, internship.id),
  ]);

  const required = requirements.filter((r) => r.type === "required");
  const preferred = requirements.filter((r) => r.type === "preferred");
  const isPublished = internship.status === "published";

  return (
    <Shell userEmail={user.email}>
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Workspace Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/internships/${params.slug}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-text-primary hover:border-teal hover:text-teal-dark shadow-subtle transition-all"
            >
              <Edit3 className="h-3.5 w-3.5 text-teal" /> Edit Role Parameters
            </Link>
            <Link
              href={`/dashboard/applications/${internship.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary text-white px-3.5 py-2 text-xs font-semibold shadow-teal hover:opacity-95 transition-all"
            >
              <Users className="h-3.5 w-3.5" /> View Applicants
            </Link>
          </div>
        </div>

        {/* ROLE HEADER CARD */}
        <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Tag tone={isPublished ? "teal" : "neutral"}>
              {internship.status}
            </Tag>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary tracking-tight">
            {internship.title}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-text-secondary">
            {[internship.field, internship.location, internship.work_mode, internship.duration]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {internship.description && (
            <div className="pt-3 border-t border-border space-y-1.5">
              <h2 className="font-display font-bold text-xs uppercase tracking-wider text-text-muted">
                Role Description & Overview
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-text-primary">
                {internship.description}
              </p>
            </div>
          )}
        </div>

        {/* REQUIREMENTS COLUMNS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <RequirementColumn title="Required Qualifications" tone="amber" items={required} />
          <RequirementColumn title="Preferred Competencies" tone="teal" items={preferred} />
        </div>

        {/* SCREENING QUESTIONS */}
        <ScreeningQuestions
          internshipId={internship.id}
          initialQuestions={questions}
        />

        {/* PUBLISH PANEL */}
        <PublishPanel
          internshipId={internship.id}
          title={internship.title}
          publicSlug={internship.public_slug}
          initialStatus={internship.status}
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
    <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-3">
      <h3 className="font-display font-bold text-sm text-primary dark:text-white">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-text-muted italic">None specified</span>
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
