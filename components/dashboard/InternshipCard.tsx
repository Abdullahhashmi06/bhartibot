"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, ArrowRight, Copy, Archive, ArchiveRestore, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Tag from "@/components/ui/Tag";
import { Internship } from "@/lib/types";
import { duplicateInternshipAction, archiveInternshipAction, restoreInternshipAction } from "@/app/dashboard/actions";
import { toast } from "sonner";

interface InternshipCardProps {
  internship: Internship & { applicantCount: number };
}

export default function InternshipCard({ internship }: InternshipCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDuplicate = async () => {
    setIsMenuOpen(false);
    setIsPending(true);
    toast.loading("Duplicating internship...", { id: "dup" });
    try {
      await duplicateInternshipAction(internship.id);
      toast.success("Internship duplicated successfully", { id: "dup" });
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate", { id: "dup" });
    } finally {
      setIsPending(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsMenuOpen(false);
    setIsPending(true);
    const isArchiving = internship.status !== "archived";
    toast.loading(isArchiving ? "Archiving..." : "Restoring...", { id: "arc" });
    try {
      if (isArchiving) {
        await archiveInternshipAction(internship.id);
        toast.success("Internship archived", { id: "arc" });
      } else {
        await restoreInternshipAction(internship.id);
        toast.success("Internship restored to draft", { id: "arc" });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update status", { id: "arc" });
    } finally {
      setIsPending(false);
    }
  };

  const getTone = (status: string) => {
    if (status === "published") return "teal";
    if (status === "archived") return "neutral";
    return "amber";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => { setIsHovered(false); setIsMenuOpen(false); }}
      className={`relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition-all duration-200 ${
        internship.status === "archived" 
          ? "border-dashed border-border opacity-75 hover:opacity-100" 
          : "border-border shadow-card hover:shadow-hover hover:border-teal"
      } ${isPending ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/internships/${internship.public_slug}`}
            className="font-display font-bold text-lg text-primary group-hover:text-teal-dark transition-colors truncate"
          >
            {internship.title}
          </Link>
          <Tag tone={getTone(internship.status)}>
            {internship.status}
          </Tag>
        </div>
        <p className="text-xs text-text-secondary font-medium truncate">
          {[internship.field, internship.location, internship.work_mode, internship.duration]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
        
        {/* Actions Menu (Desktop Hover / Mobile Always Visible) */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-xl text-text-secondary hover:bg-slate-100 transition-all ${
              isHovered || isMenuOpen ? "opacity-100" : "opacity-0 sm:opacity-0 opacity-100" // always show on mobile
            }`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-ai border border-slate-100 overflow-hidden z-20"
              >
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-slate-50 transition-colors"
                >
                  <Copy className="h-4 w-4 text-text-muted" /> Duplicate
                </button>
                <button
                  onClick={handleArchiveToggle}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  {internship.status === "archived" ? (
                    <>
                      <ArchiveRestore className="h-4 w-4 text-emerald" /> 
                      <span className="text-emerald">Restore</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 text-danger" /> 
                      <span className="text-danger">Archive</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          href={`/dashboard/applications/${internship.id}`}
          className="flex items-center gap-2 rounded-xl bg-slate-50 border border-border px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-teal-light hover:text-teal-dark hover:border-teal/30 transition-all"
        >
          <Users className="h-3.5 w-3.5 text-teal" />
          <span className="font-display font-extrabold text-sm text-primary">
            {internship.applicantCount}
          </span>
          <span className="hidden sm:inline">{internship.applicantCount === 1 ? "applicant" : "applicants"}</span>
        </Link>

        <Link
          href={`/internships/${internship.public_slug}`}
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-white text-text-secondary hover:bg-primary hover:text-white transition-all shadow-subtle"
          title="Manage Role & Screening Questions"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
