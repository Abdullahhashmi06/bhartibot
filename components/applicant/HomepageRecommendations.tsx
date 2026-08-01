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
import OpportunityCard from "@/components/applicant/OpportunityCard";
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
}

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
    },
    {
      key: "recent",
      title: "Fresh Opportunities",
      subtitle: "Newest roles matching your profile",
      icon: <Sparkles className="h-4 w-4 text-teal" />,
      jobs: recentlyPosted,
      emptyText: "No fresh roles this week",
      emptyHint: "Recruiters post new internships regularly — check back soon.",
    },
    {
      key: "closing",
      title: "Closing Soon",
      subtitle: "Deadlines approaching — don't miss out",
      icon: <Calendar className="h-4 w-4 text-amber-500" />,
      jobs: closingSoon,
      emptyText: "Nothing closing soon",
      emptyHint: "You're safe for now — deadlines are a few weeks out.",
    },
    {
      key: "saved",
      title: "Your Saved Jobs",
      subtitle: "Bookmarked for later",
      icon: <Bookmark className="h-4 w-4 text-teal" />,
      jobs: saved,
      emptyText: "No saved internships yet",
      emptyHint: "Tap the bookmark icon on any opportunity to save it here.",
    },
    {
      key: "applied",
      title: "You Applied To",
      subtitle: "Track your active applications",
      icon: <Check className="h-4 w-4 text-emerald" />,
      jobs: applied,
      emptyText: "No applications yet",
      emptyHint: "Apply to your top matches to start tracking progress here.",
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {top.slice(0, 3).map((job, idx) => (
              <OpportunityCard
                key={job.id}
                job={job}
                index={idx}
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

      {/* HORIZONTAL CAROUSELS — differentiated sections */}
      {sections.map((section, sectionIdx) => (
        <section key={section.key} className="animate-fade-up" style={{ animationDelay: `${sectionIdx * 0.06}s` }}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-primary dark:text-white flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-border dark:border-slate-700 shadow-subtle">
                  {section.icon}
                </span>
                {section.title}
              </h2>
              <p className="text-xs text-text-muted dark:text-slate-500 mt-1 pl-[42px]">
                {section.subtitle}
              </p>
            </div>
            <span className="font-mono text-[11px] text-text-muted shrink-0">
              {section.jobs.length} roles
            </span>
          </div>

          {/* SNAP CAROUSEL — wheel/touch friendly, edge fade, hidden scrollbar */}
          <div className="scroll-fade-x -mx-1 px-1">
            <div className="hide-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 scroll-smooth">
              {section.jobs.slice(0, 6).map((job, idx) => (
                <OpportunityCard
                  key={job.id}
                  job={job}
                  index={idx}
                  variant="compact"
                  saved={savedSet.has(job.id)}
                  applied={appliedSet.has(job.id)}
                  applying={applying === job.id}
                  onToggleSave={() => toggleSave(job.id)}
                  onApply={() => handleApply(job)}
                  onWhyThisMatch={() => setDrawerJob(job)}
                />
              ))}
              {/* End-of-rail CTA card */}
              <Link
                href="/applicant/internships"
                className="snap-start scroll-ml-4 min-w-[220px] max-w-[220px] shrink-0 rounded-2xl border-2 border-dashed border-border dark:border-slate-700 flex flex-col items-center justify-center gap-2 p-6 text-center hover:border-teal/40 hover:bg-teal-light/30 dark:hover:bg-teal/5 transition-colors"
              >
                <Compass className="h-6 w-6 text-teal" />
                <span className="text-sm font-semibold text-primary dark:text-white">
                  Explore all internships
                </span>
                <span className="text-[11px] text-text-muted">
                  See every open opportunity
                </span>
              </Link>
            </div>
          </div>
        </section>
      ))}

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
