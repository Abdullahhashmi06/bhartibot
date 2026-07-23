import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
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
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-16 text-center">
        <CheckCircle2 size={48} className="text-teal" strokeWidth={1.5} />
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">
            Application submitted
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Thank you for applying to{" "}
            <span className="font-medium text-text">{internship.title}</span>.
            The recruiting team will review your application and get in touch if
            there is a fit.
          </p>
        </div>
        <ButtonLink href="/" variant="secondary">
          Back to BhartiBot
        </ButtonLink>
        <p className="text-xs text-muted">
          Need to apply again?{" "}
          <Link
            href={`/apply/${params.slug}`}
            className="text-ink underline underline-offset-2 hover:no-underline"
          >
            Return to the application form
          </Link>
        </p>
      </div>
    </Shell>
  );
}
