"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Download, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Application, CandidateAiAnalysis } from "@/lib/types";
import { downloadCandidatePdf } from "@/lib/export/pdf";
import { downloadCsv, CsvRow } from "@/lib/export/csv";
import { generateAndDownloadXlsx, ExcelRow } from "@/lib/export/xlsx";
import { cn } from "@/lib/utils";

interface ExportActionsProps {
  applications?: (Application & { match_score?: number | null; recommendation?: string })[];
  candidates?: (Application & { match_score?: number | null; recommendation?: string })[];
  analysis?: CandidateAiAnalysis | null;
  notes?: string;
  internshipTitle?: string;
  variant?: "single" | "bulk";
}

export default function ExportActions({
  applications,
  candidates: candidatesProp,
  analysis,
  notes,
  internshipTitle,
  variant = "single",
}: ExportActionsProps) {
  const [open, setOpen] = useState(false);
  const candidates = applications || candidatesProp;

  async function handleExportPdf() {
    try {
      if (analysis) {
        downloadCandidatePdf({
          application: candidates?.[0] || ({} as Application),
          analysis,
          internshipTitle,
        });
        toast.success("PDF report downloaded");
      } else {
        toast.error("No AI analysis to export");
      }
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
    setOpen(false);
  }

  function handleExportCsv() {
    try {
      if (!candidates || candidates.length === 0) {
        toast.error("No candidates to export");
        return;
      }

      const rows: CsvRow[] = candidates.map((c) => ({
        Name: c.applicant_name || "Unknown",
        Email: c.email || "",
        University: c.university || "",
        Degree: c.degree || "",
        CGPA: c.cgpa || "",
        "AI Score": c.match_score !== undefined && c.match_score !== null ? `${c.match_score}%` : "N/A",
        Recommendation: c.recommendation || "N/A",
        Status: c.status || "new",
        "Interview Status": "N/A",
        "Recruiter Notes": notes || "",
      }));

      downloadCsv(rows, `candidates_export_${Date.now()}.csv`);
      toast.success("CSV exported successfully");
    } catch (e) {
      toast.error("Failed to export CSV");
    }
    setOpen(false);
  }

  function handleExportXlsx() {
    try {
      if (!candidates || candidates.length === 0) {
        toast.error("No candidates to export");
        return;
      }

      const rows: ExcelRow[] = candidates.map((c) => ({
        Name: c.applicant_name || "Unknown",
        Email: c.email || "",
        University: c.university || "",
        Degree: c.degree || "",
        CGPA: c.cgpa || "",
        "AI Score": c.match_score !== undefined && c.match_score !== null ? c.match_score : "N/A",
        Recommendation: c.recommendation || "N/A",
        Status: c.status || "new",
        "Interview Status": "N/A",
        "Recruiter Notes": notes || "",
      }));

      generateAndDownloadXlsx(rows, `candidates_export_${Date.now()}.xlsx`);
      toast.success("Excel file exported successfully");
    } catch (e) {
      toast.error("Failed to export Excel");
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
          open
            ? "bg-teal-light text-teal-dark border-teal/30 dark:bg-teal/20"
            : "border-border bg-white dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
        )}
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 shadow-ai overflow-hidden z-30"
          >
            {variant === "single" && analysis && (
              <button
                onClick={handleExportPdf}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-text-primary dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <FileText className="h-4 w-4 text-purple-ai" />
                <span>Export PDF Report</span>
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-text-primary dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FileDown className="h-4 w-4 text-teal" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportXlsx}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-text-primary dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald" />
              <span>Export Excel</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
