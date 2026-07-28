import { redirect, notFound } from "next/navigation";
import { getCvSignedUrl } from "@/lib/queries/storage";
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
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Download,
  Eye,
} from "lucide-react";
import Shell from "@/components/layout/Shell";
import Tag from "@/components/ui/Tag";
import StatusSelect from "@/components/applications/StatusSelect";
import { createClient } from "@/lib/supabase/server";
import {
  getApplicationById,
  getApplicationAnswers,
} from "@/lib/queries/applications";
import { getRecruiterInternships, getInternshipRequirements } from "@/lib/queries/internships";
import { ensureCandidateAnalysis } from "@/lib/ai/analysis";
import AiAnalysisPanel from "@/components/applications/AiAnalysisPanel";
import { getAvatarUrl } from "@/lib/utils";

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
  const cvUrl = application.cv_path
    ? await getCvSignedUrl(supabase, application.cv_path)
    : null;

  const requirements = await getInternshipRequirements(
    supabase,
    params.internshipId
  );

  const analysisState = await ensureCandidateAnalysis({
    supabase,
    application,
    internship,
    requirements,
    screeningAnswers: answers,
  });

  const initialAnalysis =
    analysisState.kind === "success" ? analysisState.analysis : null;
  const initialFailure =
    analysisState.kind === "failure" ? analysisState.failure : null;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const avatarUrl = getAvatarUrl(application.applicant_name);

  return (
    <Shell userEmail={user.email}>
      <div className="space-y-8">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href={`/dashboard/applications/${params.internshipId}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Candidate Pool
          </Link>

          <span className="font-mono text-xs text-text-muted">
            Application ID: {application.id.slice(0, 8)}...
          </span>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={application.applicant_name}
                className="h-16 w-16 rounded-2xl border-2 border-teal/30 bg-slate-50 shadow-teal shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary tracking-tight">
                    {application.applicant_name}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Applied for{" "}
                  <span className="font-bold text-primary">{internship.title}</span>{" "}
                  · Submitted {timeAgo(application.created_at)}
                </p>
              </div>
            </div>

            <div className="sm:w-64">
              <StatusSelect
                applicationId={application.id}
                initialStatus={application.status}
              />
            </div>
          </div>

          {/* VISUAL RECRUITMENT TIMELINE */}
          <div className="border-t border-border pt-6 space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Recruitment Pipeline Timeline Progress
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
              <TimelineStep label="Applied" active={true} completed={true} />
              <TimelineStep label="AI Evaluated" active={true} completed={true} />
              <TimelineStep label="Viewed" active={true} completed={true} />
              <TimelineStep
                label="Shortlisted"
                active={application.status === "shortlisted"}
                completed={application.status === "shortlisted"}
              />
              <TimelineStep label="Interview" active={false} completed={false} />
              <TimelineStep label="Offer" active={false} completed={false} />
            </div>
          </div>
        </div>

        {/* MODULAR PROFILE INFORMATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PERSONAL & CONTACT DETAILS */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-base text-primary border-b border-border pb-3">
              Contact Details
            </h3>
            <div className="space-y-3">
              <InfoRow
                icon={<Mail className="h-4 w-4 text-teal" />}
                label="Email Address"
                value={application.email}
                href={`mailto:${application.email}`}
              />
              {application.phone && (
                <InfoRow
                  icon={<Phone className="h-4 w-4 text-teal" />}
                  label="Phone Number"
                  value={application.phone}
                  href={`tel:${application.phone}`}
                />
              )}
            </div>
          </div>

          {/* ACADEMIC & EDUCATION BADGES */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-base text-primary border-b border-border pb-3">
              Education Background
            </h3>
            <div className="space-y-3">
              {application.university && (
                <InfoRow
                  icon={<GraduationCap className="h-4 w-4 text-purple-ai" />}
                  label="University / Institution"
                  value={application.university}
                />
              )}
              {application.degree && (
                <InfoRow
                  label="Degree Program"
                  value={application.degree}
                />
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {application.semester && (
                  <div className="rounded-xl bg-slate-50 border border-border p-2.5 text-center">
                    <span className="font-mono text-[10px] text-text-muted uppercase block">Semester</span>
                    <span className="font-display font-bold text-sm text-primary">{application.semester}</span>
                  </div>
                )}
                {application.cgpa && (
                  <div className="rounded-xl bg-teal-light border border-teal/20 p-2.5 text-center">
                    <span className="font-mono text-[10px] text-teal-dark uppercase block font-bold">CGPA</span>
                    <span className="font-display font-extrabold text-sm text-teal-dark">{application.cgpa}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PROFESSIONAL LINKS */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-base text-primary border-b border-border pb-3">
              Professional Links
            </h3>
            <div className="space-y-3">
              {application.linkedin_url ? (
                <InfoRow
                  icon={<Linkedin className="h-4 w-4 text-info" />}
                  label="LinkedIn Profile"
                  value={application.linkedin_url}
                  href={application.linkedin_url}
                  external
                />
              ) : (
                <span className="text-xs text-text-muted italic">No LinkedIn provided</span>
              )}
              {application.github_url && (
                <InfoRow
                  icon={<Github className="h-4 w-4 text-primary" />}
                  label="GitHub Portfolio"
                  value={application.github_url}
                  href={application.github_url}
                  external
                />
              )}
              {application.portfolio_url && (
                <InfoRow
                  icon={<Globe className="h-4 w-4 text-emerald" />}
                  label="Personal Website"
                  value={application.portfolio_url}
                  href={application.portfolio_url}
                  external
                />
              )}
            </div>
          </div>
        </div>

        {/* CV CARD & PREVIEW LAUNCHER */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-light text-purple-ai border border-purple-ai/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-primary">
                  Attached Resume / CV File
                </h3>
                <p className="text-xs text-text-secondary">
                  PDF document processed by InternIQ AI evidence parser.
                </p>
              </div>
            </div>

            {cvUrl && (
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-4 py-2 text-xs font-semibold shadow-teal hover:opacity-95 transition-all"
              >
                <Eye className="h-4 w-4" /> Open / Download PDF CV
              </a>
            )}
          </div>

          {application.cv_path ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-8 w-8 text-purple-ai shrink-0" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-primary truncate">
                    {application.cv_path.split("/").pop()}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted truncate">
                    {application.cv_path}
                  </p>
                </div>
              </div>

              {cvUrl ? (
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={cvUrl}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-text-primary hover:border-teal hover:text-teal-dark shadow-subtle transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              ) : (
                <span className="text-xs text-danger font-semibold">
                  CV Link Expired / Unavailable
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">
              No CV uploaded — the applicant submitted without attaching a PDF.
            </p>
          )}
        </div>

        {/* SCREENING ANSWERS ACCORDION */}
        {answers.length > 0 && (
          <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
            <h3 className="font-display font-bold text-lg text-primary border-b border-border pb-3">
              Candidate Screening Responses ({answers.length})
            </h3>
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-slate-50/50 p-4 space-y-2"
                >
                  <p className="font-display font-bold text-xs sm:text-sm text-primary">
                    {i + 1}. {a.question}
                  </p>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {a.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HERO AI ANALYSIS REPORT PANEL */}
        <AiAnalysisPanel
          internshipId={params.internshipId}
          applicationId={params.applicationId}
          hasCv={Boolean(application.cv_path)}
          initialAnalysis={initialAnalysis}
          initialFailure={initialFailure}
        />
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
      className="text-xs sm:text-sm font-semibold text-teal-dark hover:underline truncate flex items-center gap-1"
    >
      <span className="truncate">{value}</span>
      {external && <ExternalLink className="h-3 w-3 shrink-0" />}
    </a>
  ) : (
    <span className="text-xs sm:text-sm font-semibold text-primary truncate">{value}</span>
  );

  return (
    <div className="space-y-0.5 min-w-0">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-mono text-[10px] uppercase font-bold text-text-muted tracking-wider">
          {label}
        </span>
      </div>
      {content}
    </div>
  );
}

function TimelineStep({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div
        className={`h-2.5 w-full rounded-full transition-all ${
          completed
            ? "bg-teal shadow-teal"
            : active
            ? "bg-purple-ai shadow-ai"
            : "bg-slate-200"
        }`}
      />
      <span className="font-mono text-[9px] uppercase font-bold text-text-secondary truncate">
        {label}
      </span>
    </div>
  );
}
