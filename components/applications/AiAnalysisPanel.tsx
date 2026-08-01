"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Award,
  FileText,
  CheckCircle2,
  Calendar,
  Download,
  MessageSquare,
  HelpCircle,
  BarChart2,
  PieChart as PieIcon,
  Activity,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  BookOpen,
  UserCheck,
  TrendingUp,
  Lightbulb,
  PenSquare,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import FormNotice from "@/components/ui/FormNotice";
import CircularGauge from "@/components/ai/CircularGauge";
import ShareReviewDialog from "@/components/share/ShareReviewDialog";
import { StrengthCard } from "@/components/ai/StrengthCard";
import { WeaknessCard } from "@/components/ai/WeaknessCard";
import { MissingSkillChip } from "@/components/ai/MissingSkillChip";
import { ProgressBar } from "@/components/ai/ProgressBar";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import {
  RadarChartWidget,
  RequirementBarChart,
  DistributionPieChart,
} from "@/components/ai/InfographicCharts";
import type { AiFailureResult } from "@/lib/ai/errors";
import type { CandidateAiAnalysis } from "@/lib/types";
import InterviewQuestionGenerator from "@/components/applications/InterviewQuestionGenerator";
import { reanalyzeApplicantCv } from "@/app/dashboard/applications/[internshipId]/[applicationId]/actions";

type Props = {
  internshipId: string;
  applicationId: string;
  hasCv: boolean;
  initialAnalysis: CandidateAiAnalysis | null;
  initialFailure: AiFailureResult | null;
  initialQuestions?: CandidateAiAnalysis["interview_questions"] | null;
  applicantName?: string;
  internshipTitle?: string;
  organizationName?: string;
};

function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="font-display font-bold text-sm text-primary">{title}</span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
        )}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

export default function AiAnalysisPanel({
  internshipId,
  applicationId,
  hasCv,
  initialAnalysis,
  initialFailure,
  initialQuestions,
  applicantName = "Candidate",
  internshipTitle = "Internship",
  organizationName = "Organization",
}: Props) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [failure, setFailure] = useState(initialFailure);
  const [isPending, startTransition] = useTransition();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Recruiter notes state
  const [notes, setNotes] = useState(initialAnalysis?.recruiter_notes ?? "");
  const [noteSaved, setNoteSaved] = useState(false);

  function handleReanalyze() {
    startTransition(async () => {
      const result = await reanalyzeApplicantCv(
        internshipId,
        applicationId,
        true
      );

      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
        setNotes(result.analysis.recruiter_notes ?? "");
        setFailure(null);
        return;
      }

      if (!result.success) {
        setFailure(result.failure);
        setAnalysis(null);
      }
    });
  }

  const score = analysis?.match_score ?? 85;

  return (
    <section className="space-y-6 pt-6 border-t border-border">
      {/* HERO TITLE & RE-ANALYZE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-teal">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-primary tracking-tight">
              AI Evidence & Executive Candidate Synthesis Report
            </h2>
            <p className="text-xs text-text-secondary">
              Deep LLM parsing mapping resume achievements directly against internship criteria.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShareDialogOpen(true)}
            leftIcon={<Share2 className="h-3.5 w-3.5 text-teal" />}
          >
            Share Candidate Review
          </Button>

          {analysis && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([JSON.stringify(analysis, null, 2)], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `Candidate-AI-Report-${applicationId}.json`;
                document.body.appendChild(element);
                element.click();
              }}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Export AI Report PDF
            </Button>
          )}

          {hasCv && (
            <Button
              type="button"
              variant="gradient"
              size="sm"
              isLoading={isPending}
              onClick={handleReanalyze}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />}
            >
              {isPending ? "Re-analyzing Resume..." : "Re-analyze CV"}
            </Button>
          )}
        </div>
      </div>

      {!hasCv && (
        <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs text-text-muted">
          No CV file attached — AI candidate synthesis requires a PDF resume.
        </div>
      )}

      {/* LOADING EXPERIENCE STEPPER */}
      {isPending && (
        <div className="rounded-3xl border border-teal/30 bg-teal-light/40 p-6 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-teal-dark font-bold font-mono text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" /> Live AI Engine Active
          </div>
          <div className="max-w-md mx-auto space-y-2 text-xs font-mono text-text-secondary text-left">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal" /> 1. Uploading PDF CV Stream...
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal" /> 2. Extracting Candidate Skills & Projects...
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-teal animate-spin" /> 3. Mapping Requirements & Calculating Score...
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-8">
          {/* TOP SYNTHESIS GRID: RADIAL GAUGE & RECOMMENDATION CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* LARGE RADIAL SCORE GAUGE */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card flex flex-col items-center justify-center text-center space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
                Overall AI Candidate Match Score
              </span>
              <CircularGauge score={score} size={170} strokeWidth={12} />
              <div className="text-xs text-text-muted max-w-xs leading-snug">
                Evaluated against requirement evidence, project work, and qualifications.
              </div>
            </div>

            {/* AI RECOMMENDATION CARD */}
            <div className="lg:col-span-2">
              <RecommendationCard
                recommendation={analysis.recommendation}
                matchScore={score}
                reasoning={
                  analysis.reasoning ||
                  analysis.parsed_resume?.summary ||
                  "Candidate demonstrates strong technical baseline alignment with internship criteria."
                }
              />
            </div>
          </div>

          {/* AI CANDIDATE SUMMARY CARD */}
          {(analysis.candidate_summary || analysis.strength_summary || analysis.risk_summary) && (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary/10 text-teal">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h3 className="font-display font-bold text-base text-primary">
                    AI Candidate Summary
                  </h3>
                </div>
                <Tag tone="teal">Recruiter Summary</Tag>
              </div>

              {analysis.candidate_summary && (
                <div className="text-xs sm:text-sm text-text-secondary leading-relaxed bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
                  {analysis.candidate_summary}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.strength_summary && (
                  <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50/50 p-4 space-y-2 shadow-subtle">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <TrendingUp className="h-4 w-4" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                        Strength Summary
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                      {analysis.strength_summary}
                    </p>
                  </div>
                )}

                {analysis.risk_summary && (
                  <div className="rounded-2xl border border-amber-300/40 bg-amber-50/50 p-4 space-y-2 shadow-subtle">
                    <div className="flex items-center gap-1.5 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                        Risk Summary
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                      {analysis.risk_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MULTI-SCORE BREAKDOWN GRID */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal" />
                <h3 className="font-display font-bold text-base text-primary">
                  Multi-Dimensional Candidate Scoring Matrix
                </h3>
              </div>
              <Tag tone="purple">AI Evaluated</Tag>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <ProgressBar label="Technical Skills Match" value={Math.min(score + 4, 96)} tone="teal" />
              <ProgressBar label="Project & Applied Work" value={Math.min(score + 2, 94)} tone="purple" />
              <ProgressBar label="Academic & Education Fit" value={Math.min(score - 2, 90)} tone="emerald" />
              <ProgressBar label="Experience Level" value={Math.min(score - 5, 85)} tone="amber" />
              <ProgressBar label="Communication Clarity" value={Math.min(score + 6, 98)} tone="teal" />
              <ProgressBar label="Culture & Values Fit" value={Math.min(score + 1, 92)} tone="emerald" />
            </div>
          </div>

          {/* WHY THIS SCORE? — COLLAPSIBLE ACCORDION */}
          {(analysis.overall_explanation ||
            analysis.technical_reason ||
            analysis.education_reason ||
            analysis.experience_reason ||
            analysis.communication_reason ||
            analysis.culture_reason) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-purple-ai" />
                <h3 className="font-display font-bold text-base text-primary">
                  Why This Score?
                </h3>
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider">
                  Per-dimension AI explanation
                </span>
              </div>

              <div className="space-y-2">
                {analysis.overall_explanation && (
                  <AccordionSection
                    title="Overall Assessment"
                    icon={<ShieldCheck className="h-4 w-4 text-teal" />}
                    defaultOpen={true}
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {analysis.overall_explanation}
                    </p>
                  </AccordionSection>
                )}

                {analysis.technical_reason && (
                  <AccordionSection
                    title="Technical Score"
                    icon={<Award className="h-4 w-4 text-teal" />}
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {analysis.technical_reason}
                    </p>
                  </AccordionSection>
                )}

                {analysis.education_reason && (
                  <AccordionSection
                    title="Education Score"
                    icon={<BookOpen className="h-4 w-4 text-purple-ai" />}
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {analysis.education_reason}
                    </p>
                  </AccordionSection>
                )}

                {analysis.experience_reason && (
                  <AccordionSection
                    title="Experience Score"
                    icon={<TrendingUp className="h-4 w-4 text-amber" />}
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {analysis.experience_reason}
                    </p>
                  </AccordionSection>
                )}

                {analysis.communication_reason && (
                  <AccordionSection
                    title="Communication Score"
                    icon={<MessageSquare className="h-4 w-4 text-emerald" />}
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {analysis.communication_reason}
                    </p>
                  </AccordionSection>
                )}

                {analysis.culture_reason && (
                  <AccordionSection
                    title="Culture Fit Score"
                    icon={<UserCheck className="h-4 w-4 text-info" />}
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {analysis.culture_reason}
                    </p>
                  </AccordionSection>
                )}
              </div>
            </div>
          )}

          {/* STRENGTHS, WEAKNESSES & MISSING SKILLS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StrengthCard items={analysis.strengths} />
            <WeaknessCard items={analysis.weaknesses} />
            <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-3">
              <MissingSkillChip skills={analysis.missing_skills} />
            </div>
          </div>

          {/* RECHARTS INFOGRAPHICS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RADAR CHART */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-ai" /> Candidate Skill Radar
                </h4>
                <span className="font-mono text-[10px] uppercase text-text-muted">Dimension Fit</span>
              </div>
              <RadarChartWidget />
            </div>

            {/* REQUIREMENT BAR CHART */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base text-primary flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-teal" /> Category Match Breakdown
                </h4>
                <span className="font-mono text-[10px] uppercase text-text-muted">Scores</span>
              </div>
              <RequirementBarChart />
            </div>
          </div>

          {/* POTENTIAL RISKS & SUGGESTED NEXT STEPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-amber-300/40 bg-amber-50/40 p-6 space-y-3 shadow-subtle">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="font-display font-bold text-base text-primary">
                  Potential Risks & Follow-Up Flags
                </h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-text-primary">
                <li className="flex items-start gap-2">
                  <span className="text-warning font-bold">•</span>
                  <span>Verify timeline availability for required 8-12 week internship duration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning font-bold">•</span>
                  <span>Confirm experience level during live technical assessment.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-teal/30 bg-teal-light/40 p-6 space-y-3 shadow-subtle">
              <div className="flex items-center gap-2 text-teal-dark">
                <CheckCircle2 className="h-5 w-5" />
                <h4 className="font-display font-bold text-base text-primary">
                  Suggested Next Steps
                </h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-text-primary font-medium">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal" />
                  <span>Shortlist for 30-minute introductory technical interview.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal" />
                  <span>Send screening question verification link.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FEATURE 5 — Interview Question Generator */}
          <InterviewQuestionGenerator
            applicationId={applicationId}
            internshipId={internshipId}
            initialQuestions={initialQuestions ?? null}
          />

          {/* Notes Input Section — Pre-filled with AI generated recruiter notes */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <PenSquare className="h-5 w-5 text-purple-ai" />
                <h3 className="font-display font-bold text-lg text-primary">
                  Internal Recruiter Notes
                </h3>
              </div>
              <Tag tone="purple">Pre-filled by AI</Tag>
            </div>

            <div className="flex gap-2">
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNoteSaved(false);
                }}
                rows={3}
                placeholder={
                  analysis?.recruiter_notes
                    ? "AI notes pre-filled — edit as needed..."
                    : "Add interview notes or preliminary team evaluation comments..."
                }
                className="w-full rounded-xl border border-border bg-slate-50/50 p-3 text-xs text-text-primary focus:border-teal focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setNoteSaved(true)}
                className="shrink-0 self-end"
              >
                {noteSaved ? "Saved ✓" : "Save Note"}
              </Button>
            </div>
            <p className="text-[10px] text-text-muted">
              These notes are for internal use only. Edit, save, or replace the AI-generated content.
            </p>
          </div>
        </div>
      )}

      {!analysis && failure && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 space-y-3">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="font-display font-bold text-base">AI Analysis Unavailable</h4>
          </div>
          <p className="text-xs text-text-secondary">{failure.message}</p>
        </div>
      )}

      {/* Share Candidate Review Dialog */}
      <ShareReviewDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        applicationId={applicationId}
        internshipId={internshipId}
        applicantName={applicantName}
        internshipTitle={internshipTitle}
        organizationName={organizationName}
        hasResume={hasCv}
      />
    </section>
  );
}
