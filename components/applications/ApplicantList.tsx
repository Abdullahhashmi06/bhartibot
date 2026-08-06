"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApplicationWithScore } from "@/lib/queries/applications";
import { updateStatusServerAction } from "@/app/dashboard/applications/statusActions";
import { ApplicationStatus } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ApplicationCard from "./ApplicationCard";
import ApplicantFilters, { defaultFilters, FilterState } from "./ApplicantFilters";
import BulkToolbar from "./BulkToolbar";

export default function ApplicantList({
  applications: initialApplications,
  internshipId,
}: {
  applications: ApplicationWithScore[];
  internshipId: string;
}) {
  const router = useRouter();

  const [applications, setApplications] = useState(initialApplications);

  // Sync state when server data changes via router.refresh()
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<"newest" | "oldest" | "highest_score" | "lowest_score" | "az" | "za" | "updated">("newest");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const hasAiScores = applications.some((a) => a.match_score !== null);

  const filtered = useMemo(() => {
    let list = [...applications];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.applicant_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.university ?? "").toLowerCase().includes(q) ||
          (a.degree ?? "").toLowerCase().includes(q) ||
          (a.status ?? "").toLowerCase().includes(q)
      );
    }

    if (filters.statuses.length > 0) {
      list = list.filter((a) => filters.statuses.includes(a.status));
    }

    if (filters.scoreRange) {
      list = list.filter((a) => {
        if (a.match_score === null) return false;
        switch (filters.scoreRange) {
          case "90+": return a.match_score >= 90;
          case "80+": return a.match_score >= 80;
          case "70+": return a.match_score >= 70;
          case "below70": return a.match_score < 70;
          default: return true;
        }
      });
    }

    if (filters.education.length > 0) {
      list = list.filter((a) => {
        if (!a.degree) return false;
        if (filters.education.includes(a.degree)) return true;
        if (filters.education.includes("other")) {
          return !["BS CS", "BS AI", "Software Engineering", "Data Science"].includes(a.degree);
        }
        return false;
      });
    }

    if (filters.university.length > 0) {
      list = list.filter((a) => {
        if (!a.university) return false;
        if (filters.university.includes(a.university)) return true;
        if (filters.university.includes("other")) {
          return !["FAST", "NUST", "GIKI", "LUMS"].includes(a.university);
        }
        return false;
      });
    }

    if (filters.dateRange) {
      const now = Date.now();
      list = list.filter((a) => {
        const diff = now - new Date(a.created_at).getTime();
        switch (filters.dateRange) {
          case "today": return diff <= 86400000;
          case "7days": return diff <= 86400000 * 7;
          case "30days": return diff <= 86400000 * 30;
          default: return true;
        }
      });
    }

    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "highest_score") return (b.match_score ?? -1) - (a.match_score ?? -1);
      if (sort === "lowest_score") return (a.match_score ?? 101) - (b.match_score ?? 101);
      if (sort === "az") return a.applicant_name.localeCompare(b.applicant_name);
      if (sort === "za") return b.applicant_name.localeCompare(a.applicant_name);
      if (sort === "updated") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return list;
  }, [applications, search, filters, sort]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedList = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const allSelected = paginatedList.length > 0 && paginatedList.every((a) => selectedIds.has(a.id));

  function toggleSelectAll() {
    if (allSelected) {
      const next = new Set(selectedIds);
      paginatedList.forEach((a) => next.delete(a.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedList.forEach((a) => next.add(a.id));
      setSelectedIds(next);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleCompare(id: string) {
    const next = new Set(compareIds);
    if (next.has(id)) next.delete(id);
    else {
      if (next.size >= 4) {
        toast.error("You can only compare up to 4 candidates at once.");
        return;
      }
      next.add(id);
    }
    setCompareIds(next);
  }

  async function handleQuickAction(id: string, status: "shortlisted" | "rejected") {
    const appData = applications.find((a) => a.id === id);
    const prevStatus = appData?.status as ApplicationStatus | string;

    // Optimistic local update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status } : app
      )
    );

    const { error } = await updateStatusServerAction(id, status, prevStatus, {
      internshipId,
      applicantEmail: appData?.email,
      applicantName: appData?.applicant_name,
    });

    if (error) {
      // Revert on error
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: prevStatus || app.status } : app
        )
      );
      toast.error(`Failed to update status: ${error}`);
    } else {
      toast.success(`Candidate ${status.replace("_", " ")}`);
      // Clear selection for this candidate after status update
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setCompareIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, email, or university..."
            className="w-full rounded-2xl border border-border bg-white pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 focus:outline-none transition-all shadow-subtle"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-secondary hidden sm:inline">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-teal focus:outline-none shadow-subtle"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_score">Highest AI Score</option>
            <option value="lowest_score">Lowest AI Score</option>
            <option value="updated">Latest Updated</option>
            <option value="az">Alphabetical (A-Z)</option>
            <option value="za">Alphabetical (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Component */}
      <ApplicantFilters filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} hasAiScores={hasAiScores} />

      {/* List Header with Bulk Select All */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer hover:text-primary transition-colors">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="rounded border-border text-teal focus:ring-teal cursor-pointer w-4 h-4"
            />
            Select Page
          </label>
        </div>
        <div className="font-mono text-xs font-medium text-text-muted">
          Showing {paginatedList.length} of {filtered.length} candidate{filtered.length !== 1 && "s"}
        </div>
      </div>

      {/* Applicant Cards List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white py-20 text-center shadow-subtle">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-border mb-4">
            <Inbox className="h-8 w-8 text-text-muted" />
          </div>
          <p className="font-display font-bold text-lg text-primary">No candidates found</p>
          <p className="text-sm text-text-secondary mt-1">Try adjusting your filters or search query.</p>
          <button
            onClick={() => { setSearch(""); setFilters(defaultFilters); }}
            className="mt-4 text-xs font-bold text-teal hover:text-teal-dark transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {paginatedList.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                internshipId={internshipId}
                isSelected={selectedIds.has(app.id)}
                isCompareSelected={compareIds.has(app.id)}
                onToggleSelect={toggleSelect}
                onToggleCompare={toggleCompare}
                onQuickShortlist={(id) => handleQuickAction(id, "shortlisted")}
                onQuickReject={(id) => handleQuickAction(id, "rejected")}
                compareCount={compareIds.size}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50 shadow-subtle"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs font-bold text-primary px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50 shadow-subtle"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Floating Bulk Action Toolbar */}
      <BulkToolbar
        selectedIds={Array.from(selectedIds)}
        compareIds={Array.from(compareIds)}
        totalCount={filtered.length}
        internshipId={internshipId}
        onClear={() => { setSelectedIds(new Set()); setCompareIds(new Set()); }}
        onActionComplete={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
