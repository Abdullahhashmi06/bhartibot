"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  GraduationCap,
  Users,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl, cn } from "@/lib/utils";
import Link from "next/link";
import Tag from "@/components/ui/Tag";

type SearchTab = "skills" | "universities" | "applicants" | "internships";

const tabs: { id: SearchTab; label: string; icon: typeof Search }[] = [
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "universities", label: "Universities", icon: GraduationCap },
  { id: "applicants", label: "Applicants", icon: Users },
  { id: "internships", label: "Internships", icon: Briefcase },
];

const popularSkills = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "C++",
  "Docker", "Kubernetes", "AWS", "Machine Learning", "TensorFlow",
  "SQL", "MongoDB", "GraphQL", "Figma", "UI/UX", "Git", "Linux",
];

const popularUniversities = [
  "FAST NUCES", "NUST", "LUMS", "IBA", "GIKI", "COMSATS",
  "University of Punjab", "UET Lahore",
];

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialTab = (searchParams.get("tab") as SearchTab) || "skills";
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = query.trim();

        if (activeTab === "skills") {
          // Use ilike search on strengths array via JSON contains
          const { data: analyses } = await supabase
            .from("candidate_ai_analysis")
            .select("application_id, match_score, strengths, missing_skills, recommendation, application:application_id(*)")
            .contains("strengths", [q])
            .limit(20);

          if (!analyses) {
            // Fallback: try textSearch
            const { data: fallback } = await supabase
              .from("candidate_ai_analysis")
              .select("application_id, match_score, strengths, missing_skills, recommendation, application:application_id(*)")
              .ilike("strengths::text", `%${q}%`)
              .limit(20);
            setResults(fallback || []);
          } else {
            setResults(analyses);
          }
        } else if (activeTab === "universities") {
          const { data: applications } = await supabase
            .from("applications")
            .select("*, candidate_ai_analysis(match_score)")
            .ilike("university", `%${q}%`)
            .limit(20);
          setResults(applications || []);
        } else if (activeTab === "applicants") {
          const { data: applications } = await supabase
            .from("applications")
            .select("*, candidate_ai_analysis(match_score)")
            .or(`applicant_name.ilike.%${q}%,email.ilike.%${q}%,degree.ilike.%${q}%,university.ilike.%${q}%`)
            .limit(20);
          setResults(applications || []);
        } else if (activeTab === "internships") {
          const { data: internships } = await supabase
            .from("internships")
            .select("*")
            .or(`title.ilike.%${q}%,field.ilike.%${q}%,description.ilike.%${q}%`)
            .limit(20);
          setResults(internships || []);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, activeTab, supabase]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            activeTab === "skills"
              ? "Search by skill (e.g., Python, React, Machine Learning...)"
              : activeTab === "universities"
              ? "Search by university name..."
              : activeTab === "applicants"
              ? "Search applicants by name, email, degree..."
              : "Search internships by title, field..."
          }
          className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white shadow-card"
          aria-label="Search input"
        />
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setQuery("");
                setResults([]);
                router.replace(`/dashboard/search?tab=${tab.id}`);
              }}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary dark:hover:text-white"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Popular Searches */}
      {!query.trim() && (
        <div className="space-y-4">
          {(activeTab === "skills" || activeTab === "universities") && (
            <div>
              <h3 className="font-display font-bold text-sm text-primary dark:text-white mb-3">
                Popular {activeTab === "skills" ? "Skills" : "Universities"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(activeTab === "skills" ? popularSkills : popularUniversities).map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="px-4 py-2 rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-text-secondary hover:text-teal-dark hover:border-teal/30 dark:hover:text-teal transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "applicants" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-text-muted opacity-20 mb-4" />
              <p className="text-sm text-text-secondary">Type a name, email, or degree to find applicants</p>
            </div>
          )}

          {activeTab === "internships" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-16 w-16 text-text-muted opacity-20 mb-4" />
              <p className="text-sm text-text-secondary">Search internships by title, field, or description</p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {query.trim() && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-primary dark:text-white">
              Results
            </h3>
            <span className="text-xs text-text-muted font-mono">
              {results.length} found
            </span>
          </div>

          {results.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-dashed border-border dark:border-slate-700 bg-white dark:bg-slate-800">
              <Search className="h-12 w-12 text-text-muted opacity-30 mb-3" />
              <p className="font-medium text-text-secondary">No results found</p>
              <p className="text-xs text-text-muted mt-1">Try a different search term</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-3">
              {results.map((item: any, idx: number) => {
                if (activeTab === "skills") {
                  const app = item.application;
                  return (
                    <motion.div
                      key={item.application_id || idx}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-card"
                    >
                      <div className="h-12 w-12 rounded-xl bg-purple-light dark:bg-purple-ai/20 text-purple-ai flex items-center justify-center border border-purple-ai/20 shrink-0">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-primary dark:text-white truncate">
                          {app?.applicant_name || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                          {app?.university && <span>{app.university}</span>}
                          {item.match_score !== null && (
                            <span className="font-semibold text-teal">{item.match_score}% match</span>
                          )}
                        </div>
                      </div>
                      {item.match_score !== null && (
                        <div className="flex items-center gap-1 rounded-lg bg-teal-light dark:bg-teal/20 px-2.5 py-1">
                          <span className="font-mono font-bold text-xs text-teal-dark">{item.match_score}%</span>
                        </div>
                      )}
                      {app?.internship_id && (
                        <Link
                          href={`/dashboard/applications/${app.internship_id}/${item.application_id}`}
                          className="shrink-0 p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </motion.div>
                  );
                }

                if (activeTab === "universities") {
                  const score = item?.candidate_ai_analysis?.[0]?.match_score;
                  return (
                    <motion.div
                      key={item.id || idx}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-card"
                    >
                      <div className="h-12 w-12 rounded-xl bg-purple-light dark:bg-purple-ai/20 text-purple-ai flex items-center justify-center border border-purple-ai/20 shrink-0">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-primary dark:text-white truncate">
                          {item.applicant_name}
                        </p>
                        <p className="text-xs text-text-secondary">{item.university} · {item.degree || "N/A"}</p>
                      </div>
                      {score !== null && (
                        <span className="font-mono font-bold text-xs text-teal">{score}%</span>
                      )}
                      <Link
                        href={`/dashboard/applications/${item.internship_id}/${item.id}`}
                        className="shrink-0 p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  );
                }

                if (activeTab === "applicants") {
                  const score = item?.candidate_ai_analysis?.[0]?.match_score;
                  return (
                    <motion.div
                      key={item.id || idx}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-card"
                    >
                      <img
                        src={getAvatarUrl(item.applicant_name)}
                        alt=""
                        className="h-12 w-12 rounded-xl border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold text-sm text-primary dark:text-white truncate">
                            {item.applicant_name}
                          </p>
                          <Tag tone={item.status === "shortlisted" ? "teal" : item.status === "rejected" ? "rose" : "neutral"}>
                            {item.status}
                          </Tag>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {item.email}
                          {item.university && ` · ${item.university}`}
                          {item.degree && ` · ${item.degree}`}
                        </p>
                      </div>
                      {score !== null && (
                        <div className="flex items-center gap-1 rounded-lg bg-teal-light dark:bg-teal/20 px-2.5 py-1">
                          <Sparkles className="h-3.5 w-3.5 text-teal" />
                          <span className="font-mono font-bold text-xs text-teal-dark">{score}%</span>
                        </div>
                      )}
                      <Link
                        href={`/dashboard/applications/${item.internship_id}/${item.id}`}
                        className="shrink-0 p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  );
                }

                if (activeTab === "internships") {
                  return (
                    <motion.div
                      key={item.id || idx}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-card"
                    >
                      <div className="h-12 w-12 rounded-xl bg-teal-light dark:bg-teal/20 text-teal-dark flex items-center justify-center border border-teal/20 shrink-0">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-primary dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {[item.field, item.location, item.work_mode].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Tag tone={item.status === "published" ? "teal" : "neutral"}>
                        {item.status}
                      </Tag>
                      <Link
                        href={`/internships/${item.public_slug}`}
                        className="shrink-0 p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  );
                }

                return null;
              })}
            </div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
