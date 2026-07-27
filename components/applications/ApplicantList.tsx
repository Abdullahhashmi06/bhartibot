"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import Tag from "@/components/ui/Tag";
import { Application } from "@/lib/types";

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
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, university, degree…"
            className="w-full rounded-md border border-border bg-paper pl-8 pr-3 py-2 text-sm text-text placeholder:text-muted/60 focus:border-ink focus:outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal size={14} className="text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-border bg-paper px-3 py-2 text-sm text-text focus:border-ink focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="rounded-md border border-border bg-paper px-3 py-2 text-sm text-text focus:border-ink focus:outline-none shrink-0"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted font-mono">
        {filtered.length} of {applications.length}{" "}
        {applications.length === 1 ? "applicant" : "applicants"}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">
            No applicants match your current filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => (
            <Link
              key={app.id}
              href={`/dashboard/applications/${internshipId}/${app.id}`}
              className="group flex items-start justify-between gap-4 rounded-md border border-border bg-white p-5 transition-all hover:border-ink hover:shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-base font-medium text-ink">
                    {app.applicant_name}
                  </h3>
                  <Tag tone={STATUS_TONES[app.status] ?? "neutral"}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </Tag>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-0">
                  {app.university && (
                    <span className="truncate">{app.university}</span>
                  )}
                  {app.degree && (
                    <>
                      <span className="hidden sm:inline text-border">·</span>
                      <span className="truncate">{app.degree}</span>
                    </>
                  )}
                  {app.cgpa && (
                    <>
                      <span className="hidden sm:inline text-border">·</span>
                      <span className="font-medium text-text">
                        {app.cgpa} CGPA
                      </span>
                    </>
                  )}
                  <span className="hidden sm:inline text-border">·</span>
                  <span>Applied {timeAgo(app.created_at)}</span>
                </div>
              </div>

              <ArrowRight
                size={18}
                className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-ink"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
