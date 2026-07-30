"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, Sparkles, ExternalLink, Star, CalendarPlus, UserCheck, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAvatarUrl, cn } from "@/lib/utils";
import Tag from "@/components/ui/Tag";
import StatusSelect from "@/components/applications/StatusSelect";

interface ShortlistedCandidate {
  id: string;
  applicant_name: string;
  email: string;
  university: string | null;
  degree: string | null;
  cgpa: string | null;
  match_score: number | null;
  recommendation: string | null;
  internship_id: string;
  internships: {
    title: string;
    company_name: string;
    location: string | null;
    work_mode: string | null;
  } | null;
  status: string;
  created_at: string;
}

interface ShortlistedCandidatesClientProps {
  candidates: ShortlistedCandidate[];
  recruiterId: string;
}

export default function ShortlistedCandidatesClient({
  candidates,
}: ShortlistedCandidatesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(
      (c) =>
        c.applicant_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.university ?? "").toLowerCase().includes(q) ||
        (c.internships?.title ?? "").toLowerCase().includes(q) ||
        (c.internships?.company_name ?? "").toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const handleSchedule = (candidate: ShortlistedCandidate) => {
    router.push(
      "/dashboard/applications/" + candidate.internship_id + "/" + candidate.id
    );
  };

  if (candidates.length === 0 && !search) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-white dark:bg-slate-800 py-20 px-6 text-center shadow-subtle">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-light text-teal border border-teal/20">
          <UserCheck className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-primary dark:text-white">
            No shortlisted candidates yet
          </h3>
          <p className="text-sm text-text-secondary dark:text-slate-400 max-w-sm">
            Shortlist candidates from applicant profiles to track them here for interviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, university, or role..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white shadow-subtle"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-white dark:bg-slate-800 py-20 px-6 text-center shadow-subtle">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-light text-teal border border-teal/20">
            <UserCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primary dark:text-white">
              No matching candidates
            </h3>
            <p className="text-sm text-text-secondary dark:text-slate-400 max-w-sm">
              Try adjusting your search query.
            </p>
          </div>
          <button
            onClick={() => setSearch("")}
            className="text-xs font-bold text-teal hover:text-teal-dark transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((candidate) => {
              const avatarUrl = getAvatarUrl(candidate.applicant_name);
              const score = candidate.match_score;
              const internship = candidate.internships;

              return (
                <motion.div
                  key={candidate.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group relative rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-card hover:shadow-hover transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        src={avatarUrl}
                        alt={candidate.applicant_name}
                        className="h-12 w-12 rounded-xl border-2 border-teal/20 bg-slate-50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-primary dark:text-white truncate">
                            {candidate.applicant_name}
                          </h3>
                          <Tag tone="teal" className="text-[10px] px-2 py-0.5">
                            Shortlisted
                          </Tag>
                        </div>
                        <p className="text-xs text-text-secondary dark:text-slate-400 truncate">
                          {candidate.email}
                        </p>
                      </div>
                    </div>

                    {score !== null && (
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0",
                          score >= 80
                            ? "bg-emerald-light text-emerald"
                            : score >= 60
                            ? "bg-teal-light text-teal-dark"
                            : "bg-slate-100 dark:bg-slate-700 text-text-muted"
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="font-mono font-bold text-sm">{score}%</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {internship && (
                      <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-slate-400">
                        <Briefcase className="h-3.5 w-3.5 text-teal shrink-0" />
                        <span className="truncate">{internship.title}</span>
                        <span className="text-text-muted"> / {internship.company_name}</span>
                      </div>
                    )}
                    {candidate.university && (
                      <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-slate-400">
                        <GraduationCap className="h-3.5 w-3.5 text-teal shrink-0" />
                        <span className="truncate">{candidate.university}</span>
                        {candidate.degree && <span> / {candidate.degree}</span>}
                      </div>
                    )}
                    {candidate.cgpa && (
                      <div className="flex items-center gap-2 text-xs">
                        <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-text-primary dark:text-white">
                          {candidate.cgpa} CGPA
                        </span>
                      </div>
                    )}
                    {candidate.recommendation && (
                      <Tag
                        tone={
                          candidate.recommendation === "Hire"
                            ? "teal"
                            : candidate.recommendation === "Interview"
                            ? "purple"
                            : candidate.recommendation === "Maybe"
                            ? "amber"
                            : "rose"
                        }
                        className="text-[10px]"
                      >
                        {candidate.recommendation}
                      </Tag>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-48">
                      <StatusSelect
                        applicationId={candidate.id}
                        initialStatus={candidate.status}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSchedule(candidate)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal text-xs font-semibold px-4 py-2 hover:bg-teal/30 dark:hover:bg-teal/30 transition-colors"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Schedule Interview
                      </button>
                      <a
                        href={
                          "/dashboard/applications/" +
                          candidate.internship_id +
                          "/" +
                          candidate.id
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold px-4 py-2 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Full Profile
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}