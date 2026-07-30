"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  UserX,
  Clock,
  Trash2,
  Download,
  GitCompare,
  X,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  bulkUpdateApplicationStatus,
  bulkDeleteApplications,
} from "@/lib/queries/applications";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import type { ApplicationStatus } from "@/lib/types";

interface BulkToolbarProps {
  selectedIds: string[];
  compareIds: string[];
  totalCount: number;
  internshipId: string;
  onClear: () => void;
  onActionComplete: () => void;
}

export default function BulkToolbar({
  selectedIds,
  compareIds,
  totalCount,
  internshipId,
  onClear,
  onActionComplete,
}: BulkToolbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "shortlist" | "reject" | "review" | "delete" | null;
    title: string;
    description: string;
    variant: "danger" | "warning" | "default";
  }>({
    open: false,
    action: null,
    title: "",
    description: "",
    variant: "danger",
  });
  const [isLoading, setIsLoading] = useState(false);

  const showBulk = selectedIds.length > 0;
  const showCompare = compareIds.length >= 2;

  async function execBulkStatus(status: ApplicationStatus) {
    setIsLoading(true);
    const { error } = await bulkUpdateApplicationStatus(
      supabase,
      selectedIds,
      status
    );
    setIsLoading(false);
    setConfirmDialog((d) => ({ ...d, open: false }));
    if (error) {
      toast.error(`Failed to update status: ${error}`);
    } else {
      toast.success(
        `${selectedIds.length} application${selectedIds.length > 1 ? "s" : ""} updated to ${status.replace("_", " ")}.`
      );
      onClear();
      onActionComplete();
      router.refresh();
    }
  }

  async function execBulkDelete() {
    setIsLoading(true);
    const { error } = await bulkDeleteApplications(supabase, selectedIds);
    setIsLoading(false);
    setConfirmDialog((d) => ({ ...d, open: false }));
    if (error) {
      toast.error(`Failed to delete applications: ${error}`);
    } else {
      toast.success(
        `${selectedIds.length} application${selectedIds.length > 1 ? "s" : ""} permanently deleted.`
      );
      onClear();
      onActionComplete();
      router.refresh();
    }
  }

  function handleConfirm() {
    if (!confirmDialog.action) return;
    if (confirmDialog.action === "shortlist") execBulkStatus("shortlisted");
    else if (confirmDialog.action === "reject") execBulkStatus("rejected");
    else if (confirmDialog.action === "review") execBulkStatus("under_review");
    else if (confirmDialog.action === "delete") execBulkDelete();
  }

  function openConfirm(
    action: typeof confirmDialog.action,
    title: string,
    description: string,
    variant: "danger" | "warning" | "default"
  ) {
    setConfirmDialog({ open: true, action, title, description, variant });
  }

  function handleExport() {
    toast.info("Export feature coming soon — CSV download will be available.");
  }

  return (
    <>
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((d) => ({ ...d, open: false }))}
        onConfirm={handleConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.action === "delete" ? "Delete" : "Confirm"}
        isLoading={isLoading}
      />

      <AnimatePresence>
        {(showBulk || showCompare) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-full max-w-3xl px-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-primary/95 p-3 sm:p-4 shadow-hover backdrop-blur-md">
              {/* Left — Selection Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal text-white text-xs font-bold shrink-0">
                  {selectedIds.length || compareIds.length}
                </div>
                <div>
                  {showBulk && (
                    <p className="text-xs font-bold text-white">
                      {selectedIds.length} of {totalCount} selected
                    </p>
                  )}
                  {showCompare && (
                    <p className="text-xs font-semibold text-teal-light">
                      {compareIds.length} candidates ready to compare
                    </p>
                  )}
                </div>
              </div>

              {/* Right — Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Compare button */}
                {showCompare && (
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/applications/compare?ids=${compareIds.join(",")}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-ai px-3 py-2 text-xs font-bold text-white hover:bg-purple-600 transition-colors shadow-ai"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    Compare {compareIds.length} Candidates
                  </button>
                )}

                {/* Bulk actions — only when selected */}
                {showBulk && (
                  <>
                    <button
                      onClick={() =>
                        openConfirm(
                          "shortlist",
                          "Shortlist Selected Candidates",
                          `Move ${selectedIds.length} candidate${selectedIds.length > 1 ? "s" : ""} to Shortlisted?`,
                          "default"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white hover:bg-teal-dark transition-colors"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Shortlist
                    </button>

                    <button
                      onClick={() =>
                        openConfirm(
                          "review",
                          "Move to Under Review",
                          `Move ${selectedIds.length} candidate${selectedIds.length > 1 ? "s" : ""} to Under Review?`,
                          "warning"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Review
                    </button>

                    <button
                      onClick={() =>
                        openConfirm(
                          "reject",
                          "Reject Selected Candidates",
                          `Mark ${selectedIds.length} candidate${selectedIds.length > 1 ? "s" : ""} as Rejected?`,
                          "warning"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Reject
                    </button>

                    <button
                      onClick={handleExport}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </button>

                    <button
                      onClick={() =>
                        openConfirm(
                          "delete",
                          "Delete Applications",
                          `Permanently delete ${selectedIds.length} application${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`,
                          "danger"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-danger/80 px-3 py-2 text-xs font-bold text-white hover:bg-danger transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}

                {/* Clear */}
                <button
                  onClick={onClear}
                  className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
