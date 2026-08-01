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
  Calendar,
  Clock,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileDown,
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
import { getAvatarUrl, extractOriginalFilename } from "@/lib/utils";
import Timeline from "@/components/applications/Timeline";
import RecruiterNotes from "@/components/applications/RecruiterNotes";
import PdfViewer from "@/components/applications/PdfViewer";
import StarButton from "@/components/applications/StarButton";
import InterviewStatusComponent from "@/components/applications/InterviewStatus";
import { getInterview } from "@/lib/queries/interview";
import { isStarred } from "@/lib/queries/star-candidates";
import { getNotesByApplication } from "@/lib/queries/recruiter-notes";
import { downloadCandidatePdf } from "@/lib/export/pdf";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

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

  // Fetch interview and star status in parallel
  const [interview, starred] = await Promise.all([
    getInterview(supabase, params.applicationId),
    isStarred(supabase, user.id, params.applicationId),
  ]);

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

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted">
              Application ID: {application.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="rounded-3xl border border-border bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={application.applicant_name}
                className="h-16 w-16 rounded-2xl border-2 border-teal/30 bg-slate-50 dark:bg-slate-700 shadow-teal shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary dark:text-white tracking-tight">
                    {application.applicant_name}
                  </h1>
                  <StarButton
                    applicationId={application.id}
                    recruiterId={user.id}
                    initialStarred={starred}
                    size="md"
                  />
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Applied for{" "}
                  <span className="font-bold text-primary dark:text-white">{internship.title}</span>{" "}
                  · Submitted {timeAgo(application.created_at)}
                </p>
              </div>
            </div>

            <div className="sm:w-64">
              <StatusSelect
                applicationId={application.id}
                initialStatus={application.status}
                applicantEmail={application.email}
                applicantName={application.applicant_name}
                internshipTitle={internship.title}
                internshipId={params.internshipId}
              />
            </div>
          </div>

          {/* VISUAL RECRUITMENT TIMELINE */}
          <div className="border-t border-border dark:border-slate-700 pt-6">
            <Timeline status={application.status} appliedAt={application.created_at} />
          </div>
        </div>

        {/* MODULAR PROFILE INFORMATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PERSONAL & CONTACT DETAILS */}
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-base text-primary dark:text-white border-b border-border dark:border-slate-700 pb-3">
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
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-base text-primary dark:text-white border-b border-border dark:border-slate-700 pb-3">
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
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-700 border border-border dark:border-slate-600 p-2.5 text-center">
                    <span className="font-mono text-[10px] text-text-muted uppercase block">Semester</span>
                    <span className="font-display font-bold text-sm text-primary dark:text-white">{application.semester}</span>
                  </div>
                )}
                {application.cgpa && (
                  <div className="rounded-xl bg-teal-light dark:bg-teal/20 border border-teal/20 p-2.5 text-center">
                    <span className="font-mono text-[10px] text-teal-dark uppercase block font-bold">CGPA</span>
                    <span className="font-display font-extrabold text-sm text-teal-dark">{application.cgpa}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INTERVIEW STATUS */}
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
            <h3 className="font-display font-bold text-base text-primary dark:text-white border-b border-border dark:border-slate-700 pb-3">
              Interview Pipeline
            </h3>
           <InterviewStatusComponent
              interview={interview}
              applicationId={application.id}
              recruiterId={user.id}
              applicantName={application.applicant_name}
              applicantEmail={application.email}
              internshipTitle={internship.title}
            />
          </div>
        </div>

        {/* CV CARD & PREVIEW LAUNCHER */}
        <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-light dark:bg-purple-ai/20 text-purple-ai border border-purple-ai/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-primary dark:text-white">
                  Attached Resume / CV File
                </h3>
                <p className="text-xs text-text-secondary">
                  PDF document processed by InternIQ AI evidence parser.
                </p>
              </div>
            </div>
          </div>

          {application.cv_path && cvUrl ? (
            <PdfViewer url={cvUrl} filename={extractOriginalFilename(application.cv_path)} />
          ) : (
            <p className="text-xs text-text-muted italic">
              No CV uploaded — the applicant submitted without attaching a PDF.
            </p>
          )}
        </div>

        {/* INTERNAL RECRUITER NOTES */}
        <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="font-display font-bold text-lg text-primary dark:text-white border-b border-border dark:border-slate-700 pb-3">
            Internal Recruiter Notes
          </h3>
          <RecruiterNotes
            applicationId={application.id}
            recruiterId={user.id}
            recruiterEmail={user.email}
          />
        </div>

        {/* SCREENING ANSWERS ACCORDION */}
        {answers.length > 0 && (
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4">
            <h3 className="font-display font-bold text-lg text-primary dark:text-white border-b border-border dark:border-slate-700 pb-3">
              Candidate Screening Responses ({answers.length})
            </h3>
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 p-4 space-y-2"
                >
                  <p className="font-display font-bold text-xs sm:text-sm text-primary dark:text-white">
                    {i + 1}. {a.question}
                  </p>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
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
          applicantName={application.applicant_name}
          internshipTitle={internship.title}
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
    <span className="text-xs sm:text-sm font-semibold text-primary dark:text-white truncate">{value}</span>
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
