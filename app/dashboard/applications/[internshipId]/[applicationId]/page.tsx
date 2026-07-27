import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Linkedin,
  Github,
  Globe,
  FileText,
} from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import StatusSelect from "@/components/applications/StatusSelect";
import { createClient } from "@/lib/supabase/server";
import {
  getApplicationById,
  getApplicationAnswers,
} from "@/lib/queries/applications";
import { getRecruiterInternships } from "@/lib/queries/internships";

export default async function ApplicantDetailPage({
  params,
}: {
  params: { internshipId: string; applicationId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify recruiter owns this internship
  const internships = await getRecruiterInternships(supabase);
  const internship = internships.find((i) => i.id === params.internshipId);
  if (!internship) notFound();

  const [application, answers] = await Promise.all([
    getApplicationById(supabase, params.applicationId),
    getApplicationAnswers(supabase, params.applicationId),
  ]);

  if (!application || application.internship_id !== params.internshipId) {
    notFound();
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {/* Breadcrumb */}
        <Link
          href={`/dashboard/applications/${params.internshipId}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to applicants
        </Link>

        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-medium text-ink">
              {application.applicant_name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Applied to{" "}
            <span className="font-medium text-text">{internship.title}</span>{" "}
            &middot; {timeAgo(application.created_at)}
          </p>
        </div>

        {/* Status update */}
        <section className="rounded-md border border-border bg-white p-5">
          <StatusSelect
            applicationId={application.id}
            initialStatus={application.status}
          />
        </section>

        {/* Personal Info */}
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-medium text-ink">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              icon={<Mail size={14} />}
              label="Email"
              value={application.email}
              href={`mailto:${application.email}`}
            />
            {application.phone && (
              <InfoRow
                icon={<Phone size={14} />}
                label="Phone"
                value={application.phone}
                href={`tel:${application.phone}`}
              />
            )}
          </div>
        </section>

        {/* Education */}
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="font-display text-lg font-medium text-ink">
            Education
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {application.university && (
              <InfoRow
                icon={<GraduationCap size={14} />}
                label="University"
                value={application.university}
              />
            )}
            {application.degree && (
              <InfoRow
                icon={<GraduationCap size={14} />}
                label="Degree"
                value={application.degree}
              />
            )}
            {application.semester && (
              <InfoRow
                label="Semester"
                value={application.semester}
              />
            )}
            {application.cgpa && (
              <InfoRow
                label="CGPA"
                value={application.cgpa}
              />
            )}
          </div>
        </section>

        {/* Links */}
        {(application.linkedin_url ||
          application.github_url ||
          application.portfolio_url) && (
          <section className="flex flex-col gap-4 border-t border-border pt-6">
            <h2 className="font-display text-lg font-medium text-ink">
              Professional Links
            </h2>
            <div className="flex flex-col gap-2">
              {application.linkedin_url && (
                <InfoRow
                  icon={<Linkedin size={14} />}
                  label="LinkedIn"
                  value={application.linkedin_url}
                  href={application.linkedin_url}
                  external
                />
              )}
              {application.github_url && (
                <InfoRow
                  icon={<Github size={14} />}
                  label="GitHub"
                  value={application.github_url}
                  href={application.github_url}
                  external
                />
              )}
              {application.portfolio_url && (
                <InfoRow
                  icon={<Globe size={14} />}
                  label="Portfolio"
                  value={application.portfolio_url}
                  href={application.portfolio_url}
                  external
                />
              )}
            </div>
          </section>
        )}

        {/* CV */}
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="font-display text-lg font-medium text-ink">CV</h2>
          {application.cv_path ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-white p-4">
              <FileText size={18} className="text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {application.cv_path.split("/").pop()}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted truncate">
                  {application.cv_path}
                </p>
              </div>
              <a
                href={application.cv_path}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md border border-border bg-paper px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                Open CV
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted italic">
              No CV uploaded — the applicant did not attach a CV.
            </p>
          )}
        </section>

        {/* Screening Answers */}
        {answers.length > 0 && (
          <section className="flex flex-col gap-4 border-t border-border pt-6">
            <h2 className="font-display text-lg font-medium text-ink">
              Screening Answers
            </h2>
            <div className="flex flex-col gap-3">
              {answers.map((a, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-white p-4"
                >
                  <p className="text-sm font-medium text-text">
                    {i + 1}. {a.question}
                  </p>
                  <p className="mt-2 text-sm text-muted">{a.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-sm text-ink hover:underline truncate"
    >
      {value}
    </a>
  ) : (
    <span className="text-sm text-text truncate">{value}</span>
  );

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted">{icon}</span>}
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      {content}
    </div>
  );
}
