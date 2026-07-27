import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import EditInternshipForm from "@/components/internships/EditInternshipForm";
import ScreeningQuestions from "@/components/internships/ScreeningQuestions";
import PublishPanel from "@/components/internships/PublishPanel";
import { createClient } from "@/lib/supabase/server";
import {
  getInternshipBySlug,
  getInternshipRequirements,
} from "@/lib/queries/internships";
import { getInternshipQuestions } from "@/lib/queries/questions";

export default async function EditInternshipPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const internship = await getInternshipBySlug(supabase, params.slug);
  if (!internship) notFound();

  const [requirements, questions] = await Promise.all([
    getInternshipRequirements(supabase, internship.id),
    getInternshipQuestions(supabase, internship.id),
  ]);

  return (
    <Shell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
        {/* Breadcrumb */}
        <Link
          href={`/internships/${params.slug}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to internship
        </Link>

        {/* Header */}
        <div className="border-b border-border pb-6">
          <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
            {internship.status}
          </Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            Edit: {internship.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Changes are saved immediately to Supabase. Screening questions can
            be managed below.
          </p>
        </div>

        {/* Edit form (title, description, requirements) */}
        <EditInternshipForm
          internship={internship}
          initialRequirements={requirements}
        />

        {/* Screening questions */}
        <div className="border-t border-border pt-6">
          <ScreeningQuestions
            internshipId={internship.id}
            initialQuestions={questions}
          />
        </div>

        {/* Publish/unpublish */}
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
