import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import EditInternshipForm from "@/components/internships/EditInternshipForm";
import ScreeningQuestions from "@/components/internships/ScreeningQuestions";
import PublishPanel from "@/components/internships/PublishPanel";
import { createClient, getUserFromHeaders } from "@/lib/supabase/server";
import {
  getInternshipBySlug,
  getInternshipRequirements,
} from "@/lib/queries/internships";
import { getInternshipQuestions } from "@/lib/queries/questions";

export const dynamic = "force-dynamic";

export default async function EditInternshipPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/login");

  const internship = await getInternshipBySlug(supabase, params.slug);
  if (!internship) notFound();

  const [requirements, questions] = await Promise.all([
    getInternshipRequirements(supabase, internship.id),
    getInternshipQuestions(supabase, internship.id),
  ]);

  return (
    <Shell userEmail={headerUser.email}>
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href={`/internships/${params.slug}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Role Overview
          </Link>
        </div>

        {/* Header */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-2">
          <Tag tone={internship.status === "published" ? "teal" : "neutral"}>
            {internship.status}
          </Tag>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary tracking-tight">
            Edit Role: {internship.title}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Update role title, description, technical requirements, and custom screening questions.
          </p>
        </div>

        {/* Edit Form */}
        <EditInternshipForm
          internship={internship}
          initialRequirements={requirements}
        />

        {/* Screening Questions */}
        <ScreeningQuestions
          internshipId={internship.id}
          initialQuestions={questions}
        />

        {/* Publish / Unpublish */}
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
