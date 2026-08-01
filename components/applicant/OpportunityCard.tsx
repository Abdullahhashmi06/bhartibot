"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Building,
  Briefcase,
  Wallet,
  Bookmark,
  ExternalLink,
  Loader2,
  Check,
  Info,
  BadgeCheck,
  Calendar,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import CircularGauge from "@/components/ai/CircularGauge";
import type { RecommendationResult } from "@/lib/ai/recommendations";

/* Deterministic brand-ish logo tile for companies (no real logos available). */
const LOGO_GRADIENTS = [
  "from-emerald-dark to-teal",
  "from-teal-dark to-mint",
  "from-emerald to-mint",
  "from-slate-700 to-teal-dark",
  "from-teal to-emerald",
  "from-emerald-dark to-mint",
];

function companyLogoGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return LOGO_GRADIENTS[Math.abs(hash) % LOGO_GRADIENTS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface OpportunityCardProps {
  job: RecommendationResult;
  index?: number;
  saved: boolean;
  applied: boolean;
  applying: boolean;
  onToggleSave: () => void;
  onApply: () => void;
  onWhyThisMatch: () => void;
  /** "full" = rich grid card; "compact" = horizontal carousel card. */
  variant?: "full" | "compact";
}

export default function OpportunityCard({
  job,
  index = 0,
  saved,
  applied,
  applying,
  onToggleSave,
  onApply,
  onWhyThisMatch,
  variant = "full",
}: OpportunityCardProps) {
  const competition = job.competitionIntelligence;
  const deadlineDate = job.deadline ? new Date(job.deadline) : null;
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000)
    : null;
  const deadlinePassed = daysLeft !== null && daysLeft < 0;
  const logoGradient = companyLogoGradient(job.company_name || "C");

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
        className="min-w-[300px] max-w-[300px] snap-start scroll-ml-4 bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-border p-5 flex flex-col hover:border-teal/40 hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
      >
        {/* COMPANY + TITLE */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`h-11 w-11 rounded-xl bg-gradient-to-br ${logoGradient} text-white flex items-center justify-center font-display font-bold text-lg shadow-teal shrink-0`}
          >
            {job.company_name?.charAt(0) || "C"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-text-secondary dark:text-slate-400">
              <span className="truncate">{job.company_name}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-teal shrink-0" />
            </div>
            <h3 className="font-display font-bold text-[15px] text-primary dark:text-white leading-snug line-clamp-2">
              {job.title}
            </h3>
          </div>
          <CircularGauge
            score={job.matchScore}
            size={40}
            strokeWidth={4}
            label="Match"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted dark:text-slate-400 mb-3">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-teal" /> {job.location}
            </span>
          )}
          {job.work_mode && (
            <span className="inline-flex items-center gap-1">
              <Building className="h-3 w-3 text-teal" /> {job.work_mode}
            </span>
          )}
          {job.stipend && (
            <span className="inline-flex items-center gap-1 text-emerald-dark dark:text-mint font-semibold">
              <Wallet className="h-3 w-3" /> {job.stipend}
            </span>
          )}
        </div>

        {/* COMPETITION + DEADLINE */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
              competition.tone === "emerald"
                ? "bg-emerald-light text-emerald-dark border-emerald/20"
                : competition.tone === "amber"
                ? "bg-amber-50 text-warning border-warning/20"
                : "bg-rose-50 text-danger border-danger/20"
            }`}
          >
            {competition.dot} {competition.label}
          </span>
          <span className="text-[10px] text-text-muted">
            {job.applicant_count} applicants
          </span>
          {daysLeft !== null && (
            <span
              className={`ml-auto text-[10px] inline-flex items-center gap-1 ${
                deadlinePassed ? "text-danger" : "text-text-muted"
              }`}
            >
              <Calendar className="h-3 w-3" />{" "}
              {deadlinePassed ? "Closed" : daysLeft > 0 ? `${daysLeft}d left` : "Today"}
            </span>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border dark:border-slate-700">
          <button
            onClick={onWhyThisMatch}
            className="p-2 rounded-lg text-slate-400 hover:text-teal hover:bg-teal-light/60 transition-colors"
            aria-label="Why this match"
            title="Why this match?"
          >
            <Info className="h-4 w-4" />
          </button>
          <Button
            variant="gradient"
            size="sm"
            className="flex-1"
            onClick={onApply}
            disabled={applying || applied || deadlinePassed}
          >
            {applied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" /> Applied
              </>
            ) : applying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
          <button
            onClick={onToggleSave}
            className={`p-2 rounded-lg transition-all ${
              saved
                ? "text-teal bg-teal-light"
                : "text-slate-400 hover:text-teal hover:bg-teal-light/60"
            }`}
            aria-label="Save job"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-teal" : ""}`} />
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── FULL VARIANT ───────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-border p-6 sm:p-7 flex flex-col hover:border-teal/30 hover:shadow-hover hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* COMPANY BLOCK */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${logoGradient} text-white flex items-center justify-center font-display font-bold text-xl shadow-teal shrink-0`}
          >
            {job.company_name?.charAt(0) || "C"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-text-secondary dark:text-slate-400 truncate">
                {job.company_name}
              </span>
              <BadgeCheck className="h-4 w-4 text-teal shrink-0" />
            </div>
            <p className="text-[11px] text-text-muted dark:text-slate-500 mt-0.5">
              Posted {timeAgo(job.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-center">
            <CircularGauge score={job.matchScore} size={52} strokeWidth={5} label="Match" />
          </div>
          <div className="text-center">
            <CircularGauge
              score={job.acceptanceProbability}
              size={52}
              strokeWidth={5}
              label="Acceptance"
              tone="mint"
            />
          </div>
        </div>
      </div>

      {/* TITLE — primary focus */}
      <h3 className="font-display font-bold text-xl text-primary dark:text-white leading-snug group-hover:text-teal-dark dark:group-hover:text-teal transition-colors">
        {job.title}
      </h3>

      {/* META */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted dark:text-slate-400 mt-2">
        {job.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-teal" /> {job.location}
          </span>
        )}
        {job.work_mode && (
          <span className="inline-flex items-center gap-1.5 capitalize">
            <Building className="h-3.5 w-3.5 text-teal" /> {job.work_mode.replace("-", " ")}
          </span>
        )}
        {job.internship_type && (
          <span className="inline-flex items-center gap-1.5 capitalize">
            <Briefcase className="h-3.5 w-3.5 text-teal" /> {job.internship_type.replace("_", " ")}
          </span>
        )}
        {job.stipend && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-dark dark:text-mint">
            <Wallet className="h-3.5 w-3.5" /> {job.stipend}
          </span>
        )}
      </div>

      {/* AI REASONING */}
      {job.explanation && (
        <div
          className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border text-xs leading-relaxed mt-4 ${
            job.aiGenerated
              ? "bg-teal-light/60 dark:bg-teal/10 border-teal/20 text-teal-dark dark:text-teal-light"
              : "bg-slate-50 dark:bg-slate-700/40 border-border text-text-secondary dark:text-slate-300"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-teal" />
          <span>{job.explanation}</span>
        </div>
      )}

      {/* SKILLS */}
      {(job.matchedSkills.length > 0 || job.skillGaps.length > 0) && (
        <div className="mt-4 space-y-2.5">
          {job.matchedSkills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-dark dark:text-emerald mb-1.5">
                ✓ Matching Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.matchedSkills.slice(0, 6).map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-light dark:bg-emerald/15 text-emerald-dark dark:text-emerald border border-emerald/15 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {job.skillGaps.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                <LightbulbInline /> Skills to Learn
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.skillGaps.slice(0, 3).map((gap, idx) => (
                  <span
                    key={idx}
                    title={`${gap.priority} priority · +${gap.matchGain}% match if learned`}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25 cursor-help"
                  >
                    {gap.skill}
                    <span className="ml-1 font-bold text-emerald-dark dark:text-mint">
                      +{gap.matchGain}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPETITION INTELLIGENCE */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
            competition.tone === "emerald"
              ? "bg-emerald-light text-emerald-dark border-emerald/20"
              : competition.tone === "amber"
              ? "bg-amber-50 text-warning border-warning/20"
              : "bg-rose-50 text-danger border-danger/20"
          }`}
        >
          <Flame className="h-3 w-3" />
          {job.applicant_count} applicants · {competition.dot} {competition.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-mint-light dark:bg-mint/10 border border-mint/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-dark dark:text-mint">
          <Target className="h-3 w-3" /> Difficulty: {competition.estimatedDifficulty}
        </span>
        {daysLeft !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
              deadlinePassed
                ? "bg-rose-50 text-danger border-danger/20"
                : daysLeft <= 7
                ? "bg-amber-50 text-warning border-warning/20"
                : "bg-slate-50 dark:bg-slate-700/40 text-text-secondary dark:text-slate-300 border-border"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {deadlinePassed
              ? "Closed"
              : daysLeft === 0
              ? "Closes today"
              : `${daysLeft}d left`}
            {deadlineDate && !deadlinePassed && (
              <span className="opacity-70">· {deadlineDate.toLocaleDateString()}</span>
            )}
          </span>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-border dark:border-slate-700">
        <button
          onClick={onWhyThisMatch}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-dark dark:text-teal hover:bg-teal-light/60 dark:hover:bg-teal/10 rounded-xl transition-colors"
        >
          <Info className="h-4 w-4" /> Why This Match?
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSave}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${
              saved
                ? "bg-teal-light border-teal/30 text-teal-dark dark:bg-teal/15 dark:text-teal"
                : "border-border text-slate-400 hover:text-teal hover:border-teal/30 hover:scale-105"
            }`}
            aria-label="Save job"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-teal" : ""}`} />
          </button>

          {applied ? (
            <Button variant="secondary" disabled className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs">
              <Check className="h-4 w-4 mr-1" /> Applied
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={onApply}
              disabled={applying || deadlinePassed}
              rightIcon={
                job.public_slug ? (
                  <ExternalLink className="h-4 w-4" />
                ) : applying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
            >
              {applying ? "Applying..." : "Apply Now"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LightbulbInline() {
  return (
    <span className="inline-block align-[-2px] mr-0.5">💡</span>
  );
}
