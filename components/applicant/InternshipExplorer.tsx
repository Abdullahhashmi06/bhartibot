"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Compass,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import OpportunityCard from "@/components/applicant/OpportunityCard";
import MatchDrawer from "@/components/applicant/MatchDrawer";
import type { RecommendationResult } from "@/lib/ai/recommendations";

interface InternshipExplorerProps {
  recommended: RecommendationResult[];
  others: RecommendationResult[];
  savedJobIds: string[];
  appliedJobIds: string[];
  hasProfileSignal: boolean;
  totalCount: number;
}

export default function InternshipExplorer({
  recommended,
  others,
  savedJobIds,
  appliedJobIds,
  hasProfileSignal,
  totalCount,
}: InternshipExplorerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkMode, setFilterWorkMode] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterField, setFilterField] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set(savedJobIds));
  const [applied, setApplied] = useState<Set<string>>(new Set(appliedJobIds));
  const [applying, setApplying] = useState<string | null>(null);
  const [drawerJob, setDrawerJob] = useState<RecommendationResult | null>(null);

  const all = useMemo(() => [...recommended, ...others], [recommended, others]);

  const uniqueLocations = useMemo(
    () => Array.from(new Set(all.map((i) => i.location).filter(Boolean))) as string[],
    [all]
  );
  const uniqueFields = useMemo(
    () => Array.from(new Set(all.map((i) => i.field).filter(Boolean))) as string[],
    [all]
  );

  const matchesQuery = (item: RecommendationResult) => {
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (filterWorkMode && item.work_mode !== filterWorkMode) return false;
    if (filterLocation && item.location !== filterLocation) return false;
    if (filterField && item.field !== filterField) return false;
    return true;
  };

  const filteredRecommended = recommended.filter(matchesQuery);
  const filteredOthers = others.filter(matchesQuery);

  const hasActiveFilters =
    filterWorkMode || filterLocation || filterField || searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setFilterWorkMode("");
    setFilterLocation("");
    setFilterField("");
  };

  const toggleSave = async (internshipId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const isSaved = saved.has(internshipId);
      if (isSaved) {
        await supabase
          .from("saved_jobs")
          .delete()
          .eq("applicant_id", user.id)
          .eq("internship_id", internshipId);
        const next = new Set(saved);
        next.delete(internshipId);
        setSaved(next);
        toast.success("Removed from saved jobs");
      } else {
        await supabase
          .from("saved_jobs")
          .insert({ applicant_id: user.id, internship_id: internshipId });
        setSaved(new Set(saved).add(internshipId));
        toast.success("Job saved — it's in your Saved Jobs list!");
      }
    } catch {
      toast.error("Failed to update saved status");
    }
  };

  const handleApply = async (item: RecommendationResult) => {
    // Prefer the polished public apply flow when a slug exists.
    if (item.public_slug) {
      router.push(`/apply/${item.public_slug}`);
      return;
    }

    // Fallback: direct apply from the portal.
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
      setApplied(new Set(applied).add(item.id));
      toast.success("Application submitted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setApplying(null);
    }
  };

  const openDrawer = (job: RecommendationResult) => setDrawerJob(job);
  const closeDrawer = () => setDrawerJob(null);

  return (
    <div className="space-y-10 pb-12">
      {/* HERO HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-br from-teal-light/60 via-white to-emerald-light/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 sm:p-10 shadow-card">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-emerald/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-slate-800/80 border border-teal/20 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-teal-dark dark:text-teal">
              <Sparkles className="h-3.5 w-3.5" /> AI Career Advisor
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-light/70 dark:bg-emerald/10 border border-emerald/20 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-dark dark:text-emerald">
              <TrendingUp className="h-3.5 w-3.5" /> {totalCount} live opportunities
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-primary dark:text-white tracking-tight">
            Discover Internships{" "}
            <span className="text-gradient">Recommended For You</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-text-secondary dark:text-slate-400">
            InternIQ analyzes your profile, CV skills, projects and experience —
            then estimates both your match and your real chance of getting
            shortlisted for every opportunity.
          </p>
        </div>
      </section>

      {/* SEARCH + FILTERS */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-white dark:bg-slate-800 shadow-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all dark:text-white"
            />
          </div>
          <Button
            variant={showFilters ? "gradient" : "outline"}
            className="shrink-0 gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" /> Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-teal text-white text-[10px] rounded-full font-bold">
                {
                  [filterWorkMode, filterLocation, filterField, searchQuery].filter(
                    Boolean
                  ).length
                }
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border p-5 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-primary dark:text-white flex items-center gap-2">
                    <Filter className="h-4 w-4 text-teal" /> Filter Internships
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-teal hover:text-teal-dark transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                      Work Mode
                    </label>
                    <select
                      value={filterWorkMode}
                      onChange={(e) => setFilterWorkMode(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm dark:text-white focus:border-teal focus:outline-none"
                    >
                      <option value="">All Modes</option>
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                      Location
                    </label>
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm dark:text-white focus:border-teal focus:outline-none"
                    >
                      <option value="">All Locations</option>
                      {uniqueLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                      Field
                    </label>
                    <select
                      value={filterField}
                      onChange={(e) => setFilterField(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm dark:text-white focus:border-teal focus:outline-none"
                    >
                      <option value="">All Fields</option>
                      {uniqueFields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NO RECOMMENDATIONS YET STATE */}
      {!hasProfileSignal && totalCount > 0 && (
        <div className="rounded-2xl border border-amber-200/70 dark:border-amber-500/25 bg-amber-50/70 dark:bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-warning shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Unlock personalized recommendations
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
              Add skills, projects or experience to your profile and InternIQ will
              rank every internship with an AI match score and an estimated
              acceptance chance. Meanwhile, browse all open opportunities below.
            </p>
          </div>
        </div>
      )}

      {/* ⭐ RECOMMENDED FOR YOU */}
      {filteredRecommended.length > 0 && (
        <section className="space-y-5 animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-primary dark:text-white flex items-center gap-2">
                <span className="text-xl">⭐</span> Recommended For You
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Your strongest matches, ranked by overall fit
              </p>
            </div>
            <span className="font-mono text-xs text-text-muted font-semibold">
              {filteredRecommended.length} strong match
              {filteredRecommended.length !== 1 ? "es" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRecommended.map((job, idx) => (
                <OpportunityCard
                  key={job.id}
                  job={job}
                  index={idx}
                  saved={saved.has(job.id)}
                  applied={applied.has(job.id)}
                  applying={applying === job.id}
                  onToggleSave={() => toggleSave(job.id)}
                  onApply={() => handleApply(job)}
                  onWhyThisMatch={() => openDrawer(job)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* OTHER OPPORTUNITIES */}
      {filteredOthers.length > 0 && (
        <section className="space-y-5 animate-fade-up">
          <div className="flex items-center justify-between border-t border-border dark:border-slate-700 pt-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-primary dark:text-white flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-teal" /> Other Opportunities
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Still relevant — explore them or build the skills to match
              </p>
            </div>
            <span className="font-mono text-xs text-text-muted font-semibold">
              {filteredOthers.length} more open roles
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredOthers.map((job, idx) => (
                <OpportunityCard
                  key={job.id}
                  job={job}
                  index={idx}
                  saved={saved.has(job.id)}
                  applied={applied.has(job.id)}
                  applying={applying === job.id}
                  onToggleSave={() => toggleSave(job.id)}
                  onApply={() => handleApply(job)}
                  onWhyThisMatch={() => openDrawer(job)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {totalCount === 0 && (
        <div className="animate-fade-up text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-border shadow-subtle">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-light to-emerald-light dark:from-teal/15 dark:to-emerald/10 rotate-6" />
            <div className="absolute inset-0 rounded-3xl bg-white dark:bg-slate-800 border border-border flex items-center justify-center -rotate-6">
              <Compass className="h-10 w-10 text-teal" />
            </div>
          </div>
          <p className="text-lg font-bold text-primary dark:text-white">
            No Open Internships Right Now
          </p>
          <p className="text-sm text-text-secondary max-w-sm mx-auto mt-1">
            Recruiters haven&apos;t published any open opportunities yet. Check back
            soon — new internships are added every week.
          </p>
        </div>
      )}

      {/* FILTERED-EMPTY STATE */}
      {totalCount > 0 && filteredRecommended.length === 0 && filteredOthers.length === 0 && (
        <div className="animate-fade-up text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-border shadow-subtle">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-primary dark:text-white">
            No internships match your filters
          </p>
          <p className="text-xs text-text-secondary mt-1">Try clearing filters or searching differently.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* WHY THIS MATCH? DRAWER */}
      <MatchDrawer
        job={drawerJob}
        saved={drawerJob ? saved.has(drawerJob.id) : false}
        applied={drawerJob ? applied.has(drawerJob.id) : false}
        applying={applying === drawerJob?.id}
        onClose={closeDrawer}
        onToggleSave={toggleSave}
        onApply={handleApply}
      />
    </div>
  );
}
