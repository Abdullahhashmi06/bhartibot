"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

export interface FilterState {
  statuses: string[];
  scoreRange: string | null; // "90+"|"80+"|"70+"|"below70"|null
  education: string[];
  university: string[];
  dateRange: string | null; // "today"|"7days"|"30days"|null
}

export const defaultFilters: FilterState = {
  statuses: [],
  scoreRange: null,
  education: [],
  university: [],
  dateRange: null,
};

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "under_review", label: "Under Review", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-teal-light text-teal-dark border-teal/30" },
  { value: "rejected", label: "Rejected", color: "bg-red-50 text-danger border-red-200" },
];

const SCORE_OPTIONS = [
  { value: "90+", label: "90%+ Score", color: "bg-emerald-light text-emerald border-emerald/30" },
  { value: "80+", label: "80%+ Score", color: "bg-teal-light text-teal-dark border-teal/30" },
  { value: "70+", label: "70%+ Score", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "below70", label: "< 70% Score", color: "bg-red-50 text-danger border-red-200" },
];

const EDUCATION_OPTIONS = [
  { value: "BS CS", label: "BS CS" },
  { value: "BS AI", label: "BS AI" },
  { value: "Software Engineering", label: "Software Eng." },
  { value: "Data Science", label: "Data Science" },
  { value: "other", label: "Other" },
];

const UNIVERSITY_OPTIONS = [
  { value: "FAST", label: "FAST" },
  { value: "NUST", label: "NUST" },
  { value: "GIKI", label: "GIKI" },
  { value: "LUMS", label: "LUMS" },
  { value: "other", label: "Other" },
];

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
];

function Chip({
  label,
  active,
  color,
  onToggle,
}: {
  label: string;
  active: boolean;
  color?: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 ${
        active
          ? color ?? "bg-teal-light text-teal-dark border-teal/40"
          : "bg-white border-border text-text-secondary hover:border-teal/30 hover:text-teal-dark"
      }`}
    >
      {label}
      {active && <X className="h-3 w-3 ml-0.5" />}
    </button>
  );
}

interface ApplicantFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  hasAiScores: boolean;
}

export default function ApplicantFilters({
  filters,
  onChange,
  hasAiScores,
}: ApplicantFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount =
    filters.statuses.length +
    (filters.scoreRange ? 1 : 0) +
    filters.education.length +
    filters.university.length +
    (filters.dateRange ? 1 : 0);

  function toggleStatus(val: string) {
    const next = filters.statuses.includes(val)
      ? filters.statuses.filter((s) => s !== val)
      : [...filters.statuses, val];
    onChange({ ...filters, statuses: next });
  }

  function toggleEducation(val: string) {
    const next = filters.education.includes(val)
      ? filters.education.filter((e) => e !== val)
      : [...filters.education, val];
    onChange({ ...filters, education: next });
  }

  function toggleUniversity(val: string) {
    const next = filters.university.includes(val)
      ? filters.university.filter((u) => u !== val)
      : [...filters.university, val];
    onChange({ ...filters, university: next });
  }

  function clearAll() {
    onChange(defaultFilters);
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4 text-teal" />
          Advanced Filters
          {activeCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 ml-1" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          )}
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Always-visible status chips */}
          {STATUS_OPTIONS.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              active={filters.statuses.includes(s.value)}
              color={s.color}
              onToggle={() => toggleStatus(s.value)}
            />
          ))}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-[11px] font-semibold text-danger hover:underline ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* AI Score */}
              {hasAiScores && (
                <div className="space-y-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    AI Score
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SCORE_OPTIONS.map((s) => (
                      <Chip
                        key={s.value}
                        label={s.label}
                        active={filters.scoreRange === s.value}
                        color={s.color}
                        onToggle={() =>
                          onChange({
                            ...filters,
                            scoreRange:
                              filters.scoreRange === s.value ? null : s.value,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Degree Program
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EDUCATION_OPTIONS.map((e) => (
                    <Chip
                      key={e.value}
                      label={e.label}
                      active={filters.education.includes(e.value)}
                      onToggle={() => toggleEducation(e.value)}
                    />
                  ))}
                </div>
              </div>

              {/* University */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  University
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {UNIVERSITY_OPTIONS.map((u) => (
                    <Chip
                      key={u.value}
                      label={u.label}
                      active={filters.university.includes(u.value)}
                      onToggle={() => toggleUniversity(u.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Applied Date
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DATE_OPTIONS.map((d) => (
                    <Chip
                      key={d.value}
                      label={d.label}
                      active={filters.dateRange === d.value}
                      onToggle={() =>
                        onChange({
                          ...filters,
                          dateRange:
                            filters.dateRange === d.value ? null : d.value,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
