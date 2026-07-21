import Shell from "@/components/layout/Shell";
import { ButtonLink } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

export default function LandingPage() {
  return (
    <Shell>
      <section className="flex flex-col gap-6 py-10">
        <Tag tone="amber">Day 1 · Skeleton build</Tag>
        <h1 className="max-w-2xl font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">
          Collect internship applications.
          <br />
          Let evidence do the talking.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          BhartiBot gives recruiters one link to collect applications from
          any field, then maps each CV against the requirements you define.
          You still make the call — BhartiBot just organizes the evidence.
        </p>

        <div className="flex gap-3 pt-2">
          <ButtonLink href="/signup">Create a recruiter account</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            Log in
          </ButtonLink>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 border-t border-border pt-10 sm:grid-cols-3">
        <FeatureCard
          eyebrow="01 — Define"
          title="Set requirements"
          body="List what's required and what's preferred for each internship, across any field."
        />
        <FeatureCard
          eyebrow="02 — Collect"
          title="Share one link"
          body="Applicants apply from a public link — no account needed on their end."
        />
        <FeatureCard
          eyebrow="03 — Review"
          title="See mapped evidence"
          body="AI highlights where a CV supports a requirement — and where it doesn't."
        />
      </section>
    </Shell>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
        {eyebrow}
      </span>
      <h3 className="mt-2 font-display text-lg font-medium text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
