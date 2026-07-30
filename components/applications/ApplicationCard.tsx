"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  Sparkles,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Tag from "@/components/ui/Tag";
import type { ApplicationWithScore } from "@/lib/queries/applications";
import { getAvatarUrl } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};

const STATUS_TONES: Record<string, "neutral" | "amber" | "teal" | "rose"> = {
  new: "neutral",
  under_review: "amber",
  shortlisted: "teal",
  rejected: "rose",
};

const STATUS_BORDER: Record<string, string> = {
  new: "border-l-slate-300",
  under_review: "border-l-amber-400",
  shortlisted: "border-l-teal",
  rejected: "border-l-danger",
};

const SCORE_COLOR = (score: number | null) => {
  if (score === null) return "text-text-muted bg-slate-100";
  if (score >= 80) return "text-emerald bg-emerald-light";
  if (score >= 60) return "text-teal-dark bg-teal-light";
  if (score >= 40) return "text-warning bg-amber-50";
  return "text-danger bg-red-50";
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ApplicationCardProps {
  application: ApplicationWithScore;
  internshipId: string;
  isSelected: boolean;
  isCompareSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onQuickShortlist: (id: string) => void;
  onQuickReject: (id: string) => void;
  compareCount: number;
}

export default function ApplicationCard({
  application: app,
  internshipId,
  isSelected,
  isCompareSelected,
  onToggleSelect,
  onToggleCompare,
  onQuickShortlist,
  onQuickReject,
  compareCount,
}: ApplicationCardProps) {
  const avatarUrl = getAvatarUrl(app.applicant_name);
  const borderClass = STATUS_BORDER[app.status] ?? "border-l-slate-200";
  const scoreColorClass = SCORE_COLOR(app.match_score);
  const canAddCompare = compareCount < 4 || isCompareSelected;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-start gap-3 rounded-2xl border bg-white p-4 sm:p-5 shadow-card transition-all duration-200 hover:shadow-hover border-l-4 ${borderClass} ${
        isSelected ? "ring-2 ring-teal/50 border-teal/30" : "border-border"
      }`}
    >
      {/* Selection Checkbox */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect(app.id);
        }}
        className="mt-0.5 shrink-0 text-text-muted hover:text-teal transition-colors"
        aria-label={isSelected ? "Deselect" : "Select"}
      >
        {isSelected ? (
          <CheckSquare className="h-5 w-5 text-teal" />
        ) : (
          <Square className="h-5 w-5" />
        )}
      </button>

      {/* Avatar */}
      <img
        src={avatarUrl}
        alt={app.applicant_name}
        className="h-11 w-11 rounded-xl border border-border bg-slate-50 shrink-0 shadow-subtle mt-0.5"
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/applications/${internshipId}/${app.id}`}
                className="font-display font-bold text-base text-primary hover:text-teal-dark transition-colors truncate"
              >
                {app.applicant_name}
              </Link>
              <Tag tone={STATUS_TONES[app.status] ?? "neutral"}>
                {STATUS_LABELS[app.status] ?? app.status}
              </Tag>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              {app.university && (
                <span className="flex items-center gap-1 font-medium">
                  <GraduationCap className="h-3.5 w-3.5 text-teal shrink-0" />
                  {app.university}
                </span>
              )}
              {app.degree && (
                <span className="text-text-muted">· {app.degree}</span>
              )}
              {app.cgpa && (
                <span className="font-mono text-[11px] font-bold text-teal-dark bg-teal-light px-1.5 py-0.5 rounded-md">
                  {app.cgpa} CGPA
                </span>
              )}
              <span className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
                <Calendar className="h-3 w-3" />
                {timeAgo(app.created_at)}
              </span>
            </div>
          </div>

          {/* AI Score Badge */}
          <div className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 ${scoreColorClass} shrink-0`}>
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono font-bold text-xs">
              {app.match_score !== null ? `${app.match_score}%` : "N/A"}
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare checkbox */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (canAddCompare) onToggleCompare(app.id);
            }}
            disabled={!canAddCompare}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
              isCompareSelected
                ? "border-purple-ai/40 bg-purple-light text-purple-ai"
                : "border-border bg-slate-50 text-text-secondary hover:border-purple-ai/40 hover:text-purple-ai"
            }`}
          >
            {isCompareSelected ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            Compare
          </button>

          {/* Quick Shortlist */}
          {app.status !== "shortlisted" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickShortlist(app.id);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-teal/30 bg-teal-light px-2.5 py-1 text-[11px] font-semibold text-teal-dark hover:bg-teal/20 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Shortlist
            </button>
          )}

          {/* Quick Reject */}
          {app.status !== "rejected" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickReject(app.id);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-red-100 transition-colors"
            >
              <UserX className="h-3.5 w-3.5" />
              Reject
            </button>
          )}

          {/* View Profile Link */}
          <Link
            href={`/dashboard/applications/${internshipId}/${app.id}`}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-teal hover:text-teal-dark transition-colors"
          >
            View Profile
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
