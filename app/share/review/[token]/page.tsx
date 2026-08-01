import React from "react";
import type { Metadata } from "next";
import { Sparkles, Shield, Lock, Clock, AlertTriangle, FileText, Download, CheckCircle2, HelpCircle, User, Briefcase, Building } from "lucide-react";
import CircularGauge from "@/components/ai/CircularGauge";
import { StrengthCard } from "@/components/ai/StrengthCard";
import { WeaknessCard } from "@/components/ai/WeaknessCard";
import { MissingSkillChip } from "@/components/ai/MissingSkillChip";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { RadarChartWidget, RequirementBarChart } from "@/components/ai/InfographicCharts";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getSharedReviewDataByToken } from "@/lib/queries/share";
import type { SharedSection } from "@/lib/types";

/**
 * Dynamic Open Graph metadata for shared review pages.
 * Generates rich social previews with candidate name, position, and organization.
 * Does NOT leak data for expired, revoked, not-found, or password-protected tokens.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { pwd?: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const result = await getSharedReviewDataByToken(
    supabase,
    params.token,
    searchParams.pwd
  );

  // For error states (expired, revoked, not_found, password_required),
  // return generic metadata — never leak candidate info.
  if (result.status !== "success") {
    return {
      title: "Candidate Review — InternIQ",
      description: "Secure, read-only candidate evaluation report.",
      robots: "noindex, nofollow",
    };
  }

  const review = result.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://interniq.ai";
  const pageUrl = `${appUrl}/share/review/${params.token}`;

  const ogTitle = `${review.applicant_name} — ${review.internship_title} @ ${review.organization_name}`;
  const ogDescription = review.parsed_resume?.summary
    ? review.parsed_resume.summary.slice(0, 200)
    : `AI-powered candidate evaluation for ${review.internship_title} at ${review.organization_name}.`;

  // Build OG image URL with only non-empty params
  const ogImageParams = new URLSearchParams();
  ogImageParams.set("name", review.applicant_name);
  ogImageParams.set("position", review.internship_title);
  ogImageParams.set("org", review.organization_name);
  if (review.match_score != null) {
    ogImageParams.set("score", String(review.match_score));
  }
  const ogImageUrl = `${appUrl}/api/og/share-review?${ogImageParams.toString()}`;

  return {
    title: ogTitle,
    description: ogDescription,
    robots: "noindex, nofollow",
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: pageUrl,
      type: "website",
      siteName: "InternIQ",
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${review.applicant_name} — AI Candidate Review`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      site: "@interniq",
    },
  };
}

export default async function SharedReviewPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { pwd?: string };
}) {
  const supabase = createClient();
  const result = await getSharedReviewDataByToken(
    supabase,
    params.token,
    searchParams.pwd
  );

  // Task 14: Revoked Link
  if (result.status === "revoked") {
    return (
      <PublicShell>
        <ErrorCard
          icon={<AlertTriangle className="h-8 w-8 text-danger" />}
          title="Share Link Revoked"
          message="This shared review is no longer available."
          detail="The recruiter has revoked access to this candidate evaluation."
        />
      </PublicShell>
    );
  }

  // Task 3: Expired Link
  if (result.status === "expired") {
    return (
      <PublicShell>
        <ErrorCard
          icon={<Clock className="h-8 w-8 text-warning" />}
          title="Share Link Expired"
          message="This shared review has expired."
          detail="The access period configured by the recruiter has ended."
        />
      </PublicShell>
    );
  }

  // Task 17: Not Found / Deleted
  if (result.status === "not_found") {
    return (
      <PublicShell>
        <ErrorCard
          icon={<AlertTriangle className="h-8 w-8 text-text-muted" />}
          title="Review Not Found"
          message="The requested candidate review could not be found."
          detail="The link may be invalid or the candidate record was removed."
        />
      </PublicShell>
    );
  }

  // Task 4: Password Protection
  if (result.status === "password_required") {
    return (
      <PublicShell>
        <div className="mx-auto max-w-md space-y-6 py-12">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-card text-center space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-light text-teal-dark border border-teal/20 shadow-teal">
              <Lock className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-2xl text-primary">
                Password Protected Review
              </h1>
              <p className="text-xs text-text-secondary leading-relaxed">
                This candidate evaluation report is protected with a password. Please enter the password provided by the recruiter.
              </p>
            </div>

            {result.invalidPassword && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
                Incorrect password. Please try again.
              </div>
            )}

            <form action="" method="GET" className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="pwd-input" className="text-xs font-semibold text-text-primary">
                  Password
                </label>
                <input
                  id="pwd-input"
                  name="pwd"
                  type="password"
                  required
                  placeholder="Enter password..."
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-text-primary focus:border-teal focus:outline-none"
                  autoFocus
                />
              </div>

              <Button type="submit" variant="gradient" className="w-full py-3">
                Unlock Review
              </Button>
            </form>
          </div>
        </div>
      </PublicShell>
    );
  }

  const review = result.data;
  const sections = new Set<SharedSection>(review.shared_sections);

  return (
    <PublicShell>
      <div className="space-y-8 py-6">
        {/* HEADER BRANDING BANNER */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
              <Shield className="h-4 w-4 text-teal" />
              <span>Official Recruiter Review · Read-Only Access</span>
            </div>
            <Tag tone="teal">Verified Evaluation</Tag>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
              {review.applicant_name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-teal" /> {review.internship_title}
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-purple-ai" /> {review.organization_name}
              </span>
              {review.university && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  • {review.university}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TOP EVALUATION ROW: MATCH SCORE & RECOMMENDATION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {sections.has("match_score") && review.match_score !== null && (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card flex flex-col items-center justify-center text-center space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
                AI Candidate Match Score
              </span>
              <CircularGauge score={review.match_score} size={170} strokeWidth={12} />
              <p className="text-xs text-text-muted max-w-xs leading-snug">
                Automated evaluation against specified job requirements.
              </p>
            </div>
          )}

          {sections.has("recommendation") && review.recommendation && (
            <div className={sections.has("match_score") ? "lg:col-span-2" : "lg:col-span-3"}>
              <RecommendationCard
                recommendation={review.recommendation}
                matchScore={review.match_score ?? 85}
                reasoning={review.reasoning ?? undefined}
              />
            </div>
          )}
        </div>

        {/* CANDIDATE / RESUME SUMMARY */}
        {(sections.has("candidate_summary") || sections.has("resume_summary")) &&
          review.parsed_resume?.summary && (
            <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-3">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <User className="h-5 w-5 text-teal" /> Candidate Executive Summary
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed bg-slate-50 p-4 rounded-2xl border border-border">
                {review.parsed_resume.summary}
              </p>
            </div>
          )}

        {/* STRENGTHS & WEAKNESSES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.has("strengths") && review.strengths.length > 0 && (
            <StrengthCard items={review.strengths} />
          )}
          {sections.has("weaknesses") && review.weaknesses.length > 0 && (
            <WeaknessCard items={review.weaknesses} />
          )}
        </div>

        {/* MISSING SKILLS CHIP BREAKDOWN */}
        {sections.has("skills") && review.missing_skills.length > 0 && (
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
            <MissingSkillChip skills={review.missing_skills} />
          </div>
        )}

        {/* RADAR CHART INFOGRAPHIC */}
        {sections.has("radar_chart") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-3">
              <h3 className="font-display font-bold text-base text-primary">
                Skill Dimension Fit
              </h3>
              <RadarChartWidget />
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-3">
              <h3 className="font-display font-bold text-base text-primary">
                Category Match Breakdown
              </h3>
              <RequirementBarChart />
            </div>
          </div>
        )}

        {/* INTERVIEW QUESTIONS SECTION */}
        {sections.has("interview_questions") &&
          review.interview_questions &&
          review.interview_questions.length > 0 && (
            <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2 border-b border-border pb-3">
                <HelpCircle className="h-5 w-5 text-purple-ai" /> Recommended Interview Questions
              </h2>
              <div className="space-y-3">
                {review.interview_questions.map((q, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-purple-ai">
                        Question {idx + 1} · {q.category}
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold text-text-muted bg-white px-2 py-0.5 rounded-full border">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="font-display font-semibold text-xs sm:text-sm text-primary">
                      {q.question}
                    </p>
                    <p className="text-xs text-text-secondary font-sans italic">
                      Purpose: {q.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* RECRUITER NOTES */}
        {review.include_notes && review.recruiter_notes && (
          <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-3">
            <h2 className="font-display font-bold text-lg text-primary border-b border-border pb-3">
              Recruiter Evaluation Notes
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-text-primary whitespace-pre-line leading-relaxed">
              {review.recruiter_notes}
            </div>
          </div>
        )}

        {/* OPTIONAL RESUME DOWNLOAD LINK */}
        {review.include_resume && review.cv_url && (
          <div className="rounded-3xl border border-teal/30 bg-teal-light/30 p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-teal-dark shrink-0" />
              <div>
                <h3 className="font-display font-bold text-base text-primary">
                  Original Candidate Resume
                </h3>
                <p className="text-xs text-text-secondary">
                  Download the full PDF CV attached by the applicant.
                </p>
              </div>
            </div>
            <a
              href={review.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-5 py-2.5 text-xs font-semibold shadow-teal hover:opacity-95 transition-all shrink-0"
            >
              <Download className="h-4 w-4" /> Download PDF Resume
            </a>
          </div>
        )}
      </div>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col antialiased">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-primary">
                InternIQ
              </span>
              <span className="hidden sm:inline ml-2 font-mono text-[10px] uppercase text-text-muted">
                Candidate Review Portal
              </span>
            </div>
          </div>

          <span className="font-mono text-xs text-text-muted font-medium bg-slate-100 px-3 py-1 rounded-full">
            Read-Only Report
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-border bg-white py-6 mt-12 text-center text-xs font-mono text-text-muted">
        Shared securely using <strong>InternIQ</strong> — AI-Powered Internship Recruitment Platform.
      </footer>
    </div>
  );
}

function ErrorCard({
  icon,
  title,
  message,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  detail: string;
}) {
  return (
    <div className="mx-auto max-w-md space-y-6 py-16 text-center">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-card space-y-4">
        <div className="flex justify-center">{icon}</div>
        <h1 className="font-display font-extrabold text-2xl text-primary">
          {title}
        </h1>
        <p className="text-sm font-semibold text-text-primary">{message}</p>
        <p className="text-xs text-text-muted leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}
