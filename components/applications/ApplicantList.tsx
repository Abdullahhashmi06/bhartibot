"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight, GraduationCap, Calendar, Sparkles } from "lucide-react";
import Tag from "@/components/ui/Tag";
import { Application } from "@/lib/types";
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ApplicantList({
  applications,
  internshipId,
}: {
  applications: Application[];
  internshipId: string;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const filtered = useMemo(() => {
    let list = [...applications];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.applicant_name.toLowerCase().includes(q) ||
          (a.university ?? "").toLowerCase().includes(q) ||
          (a.degree ?? "").toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      list = list.filter((a) => a.status === filterStatus);
    }

    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [applications, search, filterStatus, sort]);

  return (
    <div className="space-y-4">
      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:gap-4 shadow-card">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, university, or degree..."
            className="w-full rounded-xl border border-border bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter Pill Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal size={14} className="text-text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-teal focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Sort Order */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-teal focus:outline-none shrink-0"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-xs text-text-muted font-medium">
          Showing {filtered.length} of {applications.length}{" "}
          {applications.length === 1 ? "candidate" : "candidates"}
        </span>
      </div>

      {/* Cards List */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16 text-center">
          <p className="text-sm text-text-secondary">
            No candidates match your search filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const avatarUrl = getAvatarUrl(app.applicant_name);

            return (
              <Link
                key={app.id}
                href={`/dashboard/applications/${internshipId}/${app.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-card hover:shadow-hover hover:border-teal transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* DiceBear Avatar */}
                  <img
                    src={avatarUrl}
                    alt={app.applicant_name}
                    className="h-12 w-12 rounded-full border border-border bg-slate-50 shrink-0 shadow-subtle"
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-base text-primary group-hover:text-teal-dark transition-colors truncate">
                        {app.applicant_name}
                      </h3>
                      <Tag tone={STATUS_TONES[app.status] ?? "neutral"}>
                        {STATUS_LABELS[app.status] ?? app.status}
                      </Tag>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                      {app.university && (
                        <span className="flex items-center gap-1 truncate font-medium">
                          <GraduationCap className="h-3.5 w-3.5 text-teal shrink-0" />
                          {app.university}
                        </span>
                      )}
                      {app.degree && (
                        <span className="truncate font-medium text-text-muted">
                          · {app.degree}
                        </span>
                      )}
                      {app.cgpa && (
                        <span className="font-mono text-xs font-bold text-teal-dark bg-teal-light px-2 py-0.5 rounded-md">
                          {app.cgpa} CGPA
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {timeAgo(app.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-text-muted border border-border group-hover:bg-gradient-primary group-hover:text-white transition-all">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
