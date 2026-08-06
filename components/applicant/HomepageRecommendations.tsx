"use client";

import { useState } from "react";
import {
  Flame,
  Sparkles,
  Calendar,
  Bookmark,
  Check,
  ArrowRight,
  Briefcase,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import OpportunityCard, { type CardTone } from "@/components/applicant/OpportunityCard";
import MatchDrawer from "@/components/applicant/MatchDrawer";
import type { RecommendationResult } from "@/lib/ai/recommendations";

interface HomepageRecommendationsProps {
  top: RecommendationResult[];
  trending: RecommendationResult[];
  recentlyPosted: RecommendationResult[];
  closingSoon: RecommendationResult[];
  saved: RecommendationResult[];
  applied: RecommendationResult[];
  savedJobIds: string[];
  appliedJobIds: string[];
}

interface SectionDef {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  jobs: RecommendationResult[];
  emptyText: string;
  emptyHint: string;
  tone: CardTone;
  iconTile: string;
  pill: string;
}

/* One distinct accent per home category so the four sections never blur
   together — rose (trending), teal (fresh), amber (closing), emerald
   (applied), violet (saved). */
const SECTION_THEMES: Record<
  string,
  { tone: CardTone; iconTile: string; pill: string }
> = {
  trending: {
    tone: "rose",
    iconTile: "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/25 dark:border-rose-500/30",
    pill: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20 dark:border-rose-500/30",
  },
  recent: {
    tone: "teal",
    iconTile: "bg-teal-light/70 dark:bg-teal/10 border-teal/25 dark:border-teal/30",
    pill: "bg-teal-light/70 dark:bg-teal/10 text-teal-dark dark:text-teal border-teal/25 dark:border-teal/30",
  },
  closing: {
    tone: "amber",
    iconTile: "bg-amber-50 dark:bg-amber-500/10 border-amber-500/25 dark:border-amber-500/30",
    pill: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30",
  },
  saved: {
    tone: "violet",
    iconTile: "bg-violet-50 dark:bg-violet-500/10 border-violet-500/25 dark:border-violet-500/30",
    pill: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20 dark:border-violet-500/30",
  },
  applied: {
    tone: "emerald",
    iconTile: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/25 dark:border-emerald-500/30",
    pill: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30",
  },
};

export default function HomepageRecommendations({
  top,
  trending,
  recentlyPosted,
  closingSoon,
  saved,
  applied,
  savedJobIds,
  appliedJobIds,
}: HomepageRecommendationsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [savedSet, setSavedSet] = useState<Set<string>>(new Set(savedJobIds));
  const [appliedSet, setAppliedSet] = useState<Set<string>>(new Set(appliedJobIds));
  const [applying, setApplying] = useState<string | null>(null);
  const [drawerJob, setDrawerJob] = useState<RecommendationResult | null>(null);

  const sections: SectionDef[] = [
    {
      key: "trending",
      title: "Trending For You",
      subtitle: "Roles other applicants are rushing to",
      icon: <Flame className="h-4 w-4 text-rose-500" />,
      jobs: trending,
      emptyText: "No trending roles yet",
      emptyHint: "New internships appear here as applicants engage with them.",
      ...SECTION_THEMES.trending,
    },
    {
      key: "recent",
      title: "Fresh Opportunities",
      subtitle: "Newest roles matching your profile",
      icon: <Sparkles className="h-4 w-4 text-teal" />,
      jobs: recentlyPosted,
      emptyText: "No fresh roles this week",
      emptyHint: "Recruiters post new internships regularly — check back soon.",
      ...SECTION_THEMES.recent,
    },
    {
      key: "closing",
      title: "Closing Soon",
      subtitle: "Deadlines approaching — don't miss out",
      icon: <Calendar className="h-4 w-4 text-amber-500" />,
      jobs: closingSoon,
      emptyText: "Nothing closing soon",
      emptyHint: "You're safe for now — deadlines are a few weeks out.",
      ...SECTION_THEMES.closing,
    },
    {
      key: "saved",
      title: "Your Saved Jobs",
      subtitle: "Bookmarked for later",
      icon: <Bookmark className="h-4 w-4 text-violet-500" />,
      jobs: saved,
      emptyText: "No saved internships yet",
      emptyHint: "Tap the bookmark icon on any opportunity to save it here.",
      ...SECTION_THEMES.saved,
    },
    {
      key: "applied",
      title: "You Applied To",
      subtitle: "Track your active applications",
      icon: <Check className="h-4 w-4 text-emerald" />,
      jobs: applied,
      emptyText: "No applications yet",
      emptyHint: "Apply to your top matches to start tracking progress here.",
      ...SECTION_THEMES.applied,
    },
  ].filter((s) => s.jobs.length > 0);

  const toggleSave = async (internshipId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const isSaved = savedSet.has(internshipId);
      if (isSaved) {
        await supabase
          .from("saved_jobs")
          .delete()
          .eq("applicant_id", user.id)
          .eq("internship_id", internshipId);
        const next = new Set(savedSet);
        next.delete(internshipId);
        setSavedSet(next);
        toast.success("Removed from saved jobs");
      } else {
        await supabase
          .from("saved_jobs")
          .insert({ applicant_id: user.id, internship_id: internshipId });
        setSavedSet(new Set(savedSet).add(internshipId));
        toast.success("Job saved!");
      }
    } catch {
      toast.error("Failed to update saved status");
    }
  };

  const handleApply = async (item: RecommendationResult) => {
    if (item.public_slug) {
      router.push(`/apply/${item.public_slug}`);
      return;
    }
    setApplying(item.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("applicant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !profile.full_name) {
        toast.error("Please complete your profile before applying");
        return;
      }

      const { error } = await supabase.from("applications").insert({
        internship_id: item.id,
        applicant_name: profile.full_name,
        email: user.email || profile.email,
        phone: profile.phone || null,
        university: profile.university || null,
        degree: profile.degree || null,
        cgpa: profile.cgpa || null,
        linkedin_url: profile.linkedin_url || null,
        github_url: profile.github_url || null,
        portfolio_url: profile.portfolio_url || null,
        cv_path: profile.cv_path || null,
        status: "new",
      });

      if (error) throw error;
      setAppliedSet(new Set(appliedSet).add(item.id));
      toast.success("Application submitted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* ⭐ TOP RECOMMENDED — your most competitive opportunities */}
      {top.length > 0 && (
        <section className="animate-fade-up">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-primary dark:text-white flex items-center gap-2">
                <span className="text-xl">⭐</span> Recommended Based On Your Profile
              </h2>
              <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                Ranked by match and estimated acceptance chance — where you&apos;re
                currently most competitive.
              </p>
            </div>
            <Link href="/applicant/internships">
              <Button variant="ghost" size="sm" className="text-teal font-semibold shrink-0">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {top.slice(0, 3).map((job, idx) => (
              <OpportunityCard
                key={job.id}
                job={job}
                index={idx}
                tone="indigo"
                saved={savedSet.has(job.id)}
                applied={appliedSet.has(job.id)}
                applying={applying === job.id}
                onToggleSave={() => toggleSave(job.id)}
                onApply={() => handleApply(job)}
                onWhyThisMatch={() => setDrawerJob(job)}
              />
            ))}
          </div>
        </section>
      )}

      {/* RESPONSIVE SECTIONS — side by side on desktop so there is no
          wasted vertical blank space; the role count sits inline next to
          the title instead of floating far right. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
        {sections.map((section, sectionIdx) => (
          <section key={section.key} className="animate-fade-up min-w-0" style={{ animationDelay: `${sectionIdx * 0.06}s` }}>
            <div className="mb-4">
              <h2 className="text-lg font-display font-bold text-primary dark:text-white flex items-center gap-2.5">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-subtle shrink-0 ${section.iconTile}`}>
                  {section.icon}
                </span>
                <span className="min-w-0 truncate">{section.title}</span>
                <span className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${section.pill}`}>
                  {section.jobs.length} role{section.jobs.length === 1 ? "" : "s"}
                </span>
              </h2>
              <p className="text-xs text-text-muted dark:text-slate-500 mt-1 pl-[42px]">
                {section.subtitle}
              </p>
            </div>

            {/* Grid — 1 mobile → 2 within each half-width desktop section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {section.jobs.slice(0, 4).map((job, idx) => (
                <OpportunityCard
                  key={job.id}
                  job={job}
                  index={idx}
                  tone={section.tone}
                  saved={savedSet.has(job.id)}
                  applied={appliedSet.has(job.id)}
                  applying={applying === job.id}
                  onToggleSave={() => toggleSave(job.id)}
                  onApply={() => handleApply(job)}
                  onWhyThisMatch={() => setDrawerJob(job)}
                />
              ))}
              {/* End-of-rail CTA card */}
              {section.jobs.length > 2 && (
                <Link
                  href="/applicant/internships"
                  className="rounded-3xl border-2 border-dashed border-border dark:border-slate-700 flex flex-col items-center justify-center gap-2 p-6 text-center hover:border-teal/40 hover:bg-teal-light/30 dark:hover:bg-teal/5 transition-colors min-h-[160px]"
                >
                  <Compass className="h-6 w-6 text-teal" />
                  <span className="text-sm font-semibold text-primary dark:text-white">
                    Explore all internships
                  </span>
                  <span className="text-[11px] text-text-muted">
                    See every open opportunity
                  </span>
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* EMPTY STATE */}
      {top.length === 0 && sections.length === 0 && (
        <div className="animate-fade-up text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-border shadow-subtle">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-light to-emerald-light dark:from-teal/15 dark:to-emerald/10 rotate-6" />
            <div className="absolute inset-0 rounded-3xl bg-white dark:bg-slate-800 border border-border flex items-center justify-center -rotate-6">
              <Briefcase className="h-10 w-10 text-teal" />
            </div>
          </div>
          <h3 className="text-lg font-display font-bold text-primary dark:text-white">
            No recommendations yet
          </h3>
          <p className="text-sm text-text-secondary dark:text-slate-400 max-w-sm mx-auto mt-1.5">
            Complete your profile and browse internships to unlock personalized,
            AI-powered recommendations.
          </p>
          <Link href="/applicant/internships">
            <Button variant="gradient" size="md" className="mt-6">
              Find Internships <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      <MatchDrawer
        job={drawerJob}
        saved={drawerJob ? savedSet.has(drawerJob.id) : false}
        applied={drawerJob ? appliedSet.has(drawerJob.id) : false}
        applying={applying === drawerJob?.id}
        onClose={() => setDrawerJob(null)}
        onToggleSave={toggleSave}
        onApply={handleApply}
      />
    </div>
  );
}
