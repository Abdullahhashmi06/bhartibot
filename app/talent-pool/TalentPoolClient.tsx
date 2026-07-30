"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  GraduationCap,
  Sparkles,
  Briefcase,
  ExternalLink,
  Users,
  Star,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { removeFromTalentPool, TalentPoolEntry } from "@/lib/queries/talent-pool";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAvatarUrl, cn } from "@/lib/utils";
import Tag from "@/components/ui/Tag";

export default function TalentPoolClient({
  entries,
  recruiterId,
}: {
  entries: TalentPoolEntry[];
  recruiterId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((entry) => {
      const a = entry.application;
      if (!a) return false;
      return (
        a.applicant_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.university ?? "").toLowerCase().includes(q) ||
        (a.degree ?? "").toLowerCase().includes(q) ||
        (entry.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [entries, search]);

  async function handleRemove(entryId: string) {
    const { error } = await removeFromTalentPool(supabase, entryId);
    if (error) {
      toast.error("Failed to remove candidate");
    } else {
      toast.success("Removed from talent pool");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, university, skills..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-white dark:bg-slate-800 py-20 px-6 text-center shadow-subtle">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-light text-purple-ai border border-purple-ai/20">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primary dark:text-white">
              {search ? "No matching candidates" : "Talent Pool is empty"}
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {search
                ? "Try adjusting your search query."
                : "Star candidates from applicant profiles to add them to your talent pool for future opportunities."}
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-bold text-teal hover:text-teal-dark transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const app = entry.application;
              if (!app) return null;
              const avatarUrl = getAvatarUrl(app.applicant_name);
              const score = (app as any).match_score;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative rounded-2xl border border-border bg-white dark:bg-slate-800 dark:border-slate-700 p-5 shadow-card hover:shadow-hover transition-all"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-start gap-3">
                    <img
                      src={avatarUrl}
                      alt={app.applicant_name}
                      className="h-12 w-12 rounded-xl border border-border bg-slate-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base text-primary dark:text-white truncate">
                        {app.applicant_name}
                      </h3>
                      <p className="text-xs text-text-secondary truncate">{app.email}</p>
                    </div>
                    {score !== undefined && score !== null && (
                      <div className={cn(
                        "flex items-center gap-1 rounded-lg px-2 py-1 shrink-0",
                        score >= 80 ? "bg-emerald-light text-emerald" : score >= 60 ? "bg-teal-light text-teal-dark" : "bg-slate-100 text-text-muted"
                      )}>
                        <Sparkles className="h-3 w-3" />
                        <span className="font-mono font-bold text-xs">{score}%</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {app.university && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <GraduationCap className="h-3.5 w-3.5 text-teal shrink-0" />
                        {app.university}
                        {app.degree && <span>· {app.degree}</span>}
                      </div>
                    )}
                    {app.cgpa && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-text-primary">{app.cgpa} CGPA</span>
                      </div>
                    )}
                    {(app as any).skills && (app as any).skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(app as any).skills.slice(0, 4).map((skill: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-text-secondary font-medium">
                            {skill}
                          </span>
                        ))}
                        {(app as any).skills.length > 4 && (
                          <span className="text-[10px] text-text-muted">+{(app as any).skills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border dark:border-slate-700">
                    <a
                      href={`/dashboard/applications/${app.internship_id}/${app.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-light text-teal-dark text-[11px] font-semibold px-3 py-1.5 hover:bg-teal/20 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Profile
                    </a>
                    {(app as any).recommendation && (
                      <Tag tone={(app as any).recommendation === "Hire" ? "teal" : (app as any).recommendation === "Interview" ? "purple" : "amber"}>
                        {(app as any).recommendation}
                      </Tag>
                    )}
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
