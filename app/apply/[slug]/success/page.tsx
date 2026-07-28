import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Shell from "@/components/layout/Shell";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getPublishedInternshipBySlug } from "@/lib/queries/internships";
import { notFound } from "next/navigation";

export default async function ApplySuccessPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const internship = await getPublishedInternshipBySlug(supabase, params.slug);

  if (!internship) {
    notFound();
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 py-20 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-light text-emerald border-2 border-emerald/30 shadow-teal">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">
            Application Submitted Successfully!
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Thank you for applying to{" "}
            <span className="font-bold text-primary">{internship.title}</span>.
            The recruiting team will evaluate your application and PDF CV evidence with InternIQ AI.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <ButtonLink href="/" variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Back to InternIQ Platform
          </ButtonLink>
        </div>

        <p className="text-xs text-text-muted">
          Need to submit another response?{" "}
          <Link
            href={`/apply/${params.slug}`}
            className="font-bold text-teal-dark underline hover:no-underline"
          >
            Return to application form
          </Link>
        </p>
      </div>
    </Shell>
  );
}
