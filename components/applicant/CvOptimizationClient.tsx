"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  FileText,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
  Copy,
  Check,
  History,
  RotateCcw,
  Edit3,
  Bookmark,
  Briefcase,
  Layers,
  Wand2,
  Save,
  Trash2,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  CvOptimizationAnalysis,
  CvOptimizationSuggestion,
  ApplicantFeedItem,
  ParsedResume,
} from "@/lib/types";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface Props {
  hasCv: boolean;
  cvPath?: string | null;
  jobs: ApplicantFeedItem[];
}

export default function CvOptimizationClient({ hasCv, cvPath, jobs }: Props) {
  // Input Selection State
  const [mode, setMode] = useState<"select_job" | "custom_job">("select_job");
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || "");
  const [customRoleTitle, setCustomRoleTitle] = useState("");
  const [customJobDescription, setCustomJobDescription] = useState("");

  // Analysis & State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<CvOptimizationAnalysis | null>(null);
  const [parsedCv, setParsedCv] = useState<ParsedResume | null>(null);
  const [activeTab, setActiveTab] = useState<"suggestions" | "evidence" | "preview">("suggestions");
  const [suggestionFilter, setSuggestionFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "high">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Saved Sessions / History Drawer
  const [savedHistory, setSavedHistory] = useState<CvOptimizationAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch saved analyses on mount
  useEffect(() => {
    fetchSavedSessions();
  }, []);

  async function fetchSavedSessions() {
    try {
      const res = await fetch("/api/applicant/cv-optimizations");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedHistory(json.data);
      }
    } catch {
      // Quiet fail if table not yet migrated
    }
  }

  // Selected job details if selecting from published internships
  const currentSelectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  // Run AI Optimization
  async function handleOptimize() {
    if (!hasCv) {
      toast.error("Please upload your CV on the Resume page first.");
      return;
    }

    const title =
      mode === "select_job"
        ? currentSelectedJob?.title || "Software Engineering Intern"
        : customRoleTitle.trim();

    if (!title) {
      toast.error("Please enter a target role title.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        targetRoleTitle: title,
      };

      if (mode === "select_job") {
        payload.targetJobId = selectedJobId;
      } else {
        payload.targetRoleDescription = customJobDescription.trim();
      }

      const res = await fetch("/api/ai/cv-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to optimize CV.");
      }

      setAnalysis(data.data);
      if (data.parsedCv) {
        setParsedCv(data.parsedCv);
      }
      setActiveTab("suggestions");
      toast.success("CV tailored successfully for " + title);
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize CV. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Suggestion actions
  function updateSuggestionStatus(id: string, status: "pending" | "accepted" | "rejected", userEdit?: string) {
    if (!analysis) return;
    const updated = analysis.suggestions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status,
          userEdit: userEdit !== undefined ? userEdit : s.userEdit,
        };
      }
      return s;
    });

    setAnalysis({
      ...analysis,
      suggestions: updated,
    });
  }

  function handleStartEdit(s: CvOptimizationSuggestion) {
    setEditingId(s.id);
    setEditText(s.userEdit || s.suggestedText);
  }

  function handleSaveEdit(id: string) {
    updateSuggestionStatus(id, "accepted", editText.trim());
    setEditingId(null);
    toast.success("Custom rewrite saved and accepted!");
  }

  // Save current version to backend
  async function handleSaveDraft(createNewVersion = false) {
    if (!analysis) return;
    setSaving(true);
    try {
      const payload: CvOptimizationAnalysis = {
        ...analysis,
        version: createNewVersion ? (analysis.version || 1) + 1 : analysis.version || 1,
        original_cv_path: cvPath,
      };

      const res = await fetch("/api/applicant/cv-optimizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save draft.");
      }

      setAnalysis(json.data);
      fetchSavedSessions();
      toast.success(
        createNewVersion
          ? `Saved as new Version ${json.data.version}!`
          : "Optimization draft saved!"
      );
    } catch (err: any) {
      toast.error(err.message || "Could not save draft to server.");
    } finally {
      setSaving(false);
    }
  }

  // Delete saved draft
  async function handleDeleteSaved(id: string) {
    try {
      const res = await fetch(`/api/applicant/cv-optimizations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedHistory((prev) => prev.filter((item) => item.id !== id));
        if (analysis?.id === id) {
          setAnalysis(null);
        }
        toast.success("Draft removed.");
      }
    } catch {
      toast.error("Failed to delete draft.");
    }
  }

  // Load saved session
  function handleLoadSaved(item: CvOptimizationAnalysis) {
    setAnalysis(item);
    setShowHistory(false);
    toast.success(`Loaded "${item.target_role_title}" (v${item.version})`);
  }

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!analysis) return [];
    return analysis.suggestions.filter((s) => {
      if (suggestionFilter === "all") return true;
      if (suggestionFilter === "pending") return s.status === "pending";
      if (suggestionFilter === "accepted") return s.status === "accepted";
      if (suggestionFilter === "rejected") return s.status === "rejected";
      if (suggestionFilter === "high") return s.impact === "high";
      return true;
    });
  }, [analysis, suggestionFilter]);

  const acceptedCount = analysis?.suggestions.filter((s) => s.status === "accepted").length || 0;
  const totalSuggestions = analysis?.suggestions.length || 0;

  // Build the live optimized CV text based on accepted suggestions & parsed CV
  const optimizedPreviewSections = useMemo(() => {
    if (!analysis) return null;

    // Accepted suggestions map by section
    const acceptedSummary = analysis.suggestions.find(
      (s) => s.section === "summary" && s.status === "accepted"
    );
    const summaryText = acceptedSummary
      ? acceptedSummary.userEdit || acceptedSummary.suggestedText
      : parsedCv?.summary || "Dedicated candidate seeking the target role.";

    // Experience bullets
    const acceptedExp = analysis.suggestions.filter(
      (s) => s.section === "experience" && s.status === "accepted"
    );
    const expBullets = acceptedExp.length > 0
      ? acceptedExp.map((s) => s.userEdit || s.suggestedText)
      : parsedCv?.experience || [];

    // Projects bullets
    const acceptedProj = analysis.suggestions.filter(
      (s) => s.section === "projects" && s.status === "accepted"
    );
    const projBullets = acceptedProj.length > 0
      ? acceptedProj.map((s) => s.userEdit || s.suggestedText)
      : parsedCv?.projects || [];

    // Skills
    const acceptedSkillsSug = analysis.suggestions.find(
      (s) => s.section === "skills" && s.status === "accepted"
    );
    let skillsList = parsedCv?.skills || [];
    if (acceptedSkillsSug) {
      const extra = (acceptedSkillsSug.userEdit || acceptedSkillsSug.suggestedText)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      skillsList = Array.from(new Set([...skillsList, ...extra]));
    }

    return {
      name: parsedCv?.candidate_name || "Applicant",
      email: parsedCv?.email || "",
      phone: parsedCv?.phone || "",
      targetRole: analysis.target_role_title,
      summary: summaryText,
      skills: skillsList,
      experience: expBullets,
      projects: projBullets,
      education: parsedCv?.education || [],
    };
  }, [analysis, parsedCv]);

  // Export PDF using jsPDF
  function exportAsPdf() {
    if (!optimizedPreviewSections || !analysis) return;
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 20;
      const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
      let y = 20;

      // Header: Name and Target Role
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(11, 31, 58);
      doc.text(optimizedPreviewSections.name, margin, y);
      y += 6;

      doc.setFontSize(12);
      doc.setTextColor(20, 184, 166);
      doc.text(optimizedPreviewSections.targetRole.toUpperCase(), margin, y);
      y += 5;

      // Contact row
      const contactInfo = [optimizedPreviewSections.email, optimizedPreviewSections.phone].filter(Boolean).join(" | ");
      if (contactInfo) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(contactInfo, margin, y);
        y += 7;
      }

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      function renderSectionHeader(title: string) {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(title.toUpperCase(), margin + 3, y + 5);
        y += 10;
      }

      function renderParagraph(text: string) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 4.5 + 4;
      }

      function renderBullets(items: string[]) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        items.forEach((item) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize("•  " + item, contentWidth - 4);
          doc.text(lines, margin + 2, y);
          y += lines.length * 4.2 + 2;
        });
        y += 3;
      }

      // 1. Professional Summary
      if (optimizedPreviewSections.summary) {
        renderSectionHeader("Professional Summary");
        renderParagraph(optimizedPreviewSections.summary);
      }

      // 2. Skills
      if (optimizedPreviewSections.skills.length > 0) {
        renderSectionHeader("Technical Skills");
        renderParagraph(optimizedPreviewSections.skills.join(" • "));
      }

      // 3. Experience
      if (optimizedPreviewSections.experience.length > 0) {
        renderSectionHeader("Work & Practical Experience");
        renderBullets(optimizedPreviewSections.experience);
      }

      // 4. Projects
      if (optimizedPreviewSections.projects.length > 0) {
        renderSectionHeader("Featured Projects");
        renderBullets(optimizedPreviewSections.projects);
      }

      // 5. Education
      if (optimizedPreviewSections.education.length > 0) {
        renderSectionHeader("Education");
        renderBullets(optimizedPreviewSections.education);
      }

      doc.save(`Optimized_CV_${analysis.target_role_title.replace(/\s+/g, "_")}_v${analysis.version}.pdf`);
      toast.success("Exported tailored PDF CV!");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  }

  // Copy Markdown / Text
  function copyMarkdown() {
    if (!optimizedPreviewSections) return;
    const md = `# ${optimizedPreviewSections.name}
**Target Role:** ${optimizedPreviewSections.targetRole}
${optimizedPreviewSections.email} | ${optimizedPreviewSections.phone}

---

## Professional Summary
${optimizedPreviewSections.summary}

## Technical Skills
${optimizedPreviewSections.skills.join(", ")}

## Work & Practical Experience
${optimizedPreviewSections.experience.map((e) => `- ${e}`).join("\n")}

## Key Projects
${optimizedPreviewSections.projects.map((p) => `- ${p}`).join("\n")}

## Education
${optimizedPreviewSections.education.map((ed) => `- ${ed}`).join("\n")}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("Tailored CV copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const scoreTone =
    (analysis?.match_score ?? 0) >= 80
      ? "text-emerald border-emerald/30 bg-emerald/10"
      : (analysis?.match_score ?? 0) >= 60
      ? "text-teal border-teal/30 bg-teal/10"
      : "text-amber-500 border-amber-500/30 bg-amber-500/10";

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-light/60 dark:bg-teal/20 border border-teal/30 px-3 py-1 text-xs font-mono font-semibold text-teal-dark dark:text-teal mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Role-Targeted CV Optimizer
          </div>
          <h1 className="text-3xl font-display font-extrabold text-primary dark:text-white">
            CV Optimization & Tailoring
          </h1>
          <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">
            Compare your resume against any target role, eliminate gaps, and rewrite achievements with quantifiable recruiter impact.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            leftIcon={<History className="h-4 w-4" />}
          >
            Saved Drafts {savedHistory.length > 0 && `(${savedHistory.length})`}
          </Button>
        </div>
      </div>

      {/* ── SAVED DRAFTS DRAWER ── */}
      {showHistory && (
        <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-primary dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-teal" /> Saved CV Optimization Sessions
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-text-muted hover:text-primary dark:hover:text-white"
            >
              Close
            </button>
          </div>

          {savedHistory.length === 0 ? (
            <p className="text-xs text-text-secondary py-4">
              No saved optimization sessions yet. Run an analysis below and save your drafts!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/40 hover:border-teal/40 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-text-muted mb-1">
                      <span>Draft v{item.version}</span>
                      <span className="font-bold text-teal">{item.match_score}% Match</span>
                    </div>
                    <p className="font-semibold text-sm text-primary dark:text-white truncate">
                      {item.target_role_title}
                    </p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-slate-800">
                    <button
                      onClick={() => handleLoadSaved(item)}
                      className="text-xs font-semibold text-teal hover:underline flex items-center gap-1"
                    >
                      Open Draft <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => item.id && handleDeleteSaved(item.id)}
                      className="text-text-muted hover:text-rose-500"
                      title="Delete draft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 1: TARGET ROLE & RESUME SELECTION ── */}
      <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal to-emerald text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-primary dark:text-white">
                Choose Target Role & Requirements
              </h2>
              <p className="text-xs text-text-secondary">
                Select an existing internship from InternIQ or paste a custom role description.
              </p>
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-border dark:border-slate-800">
            <button
              onClick={() => setMode("select_job")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === "select_job"
                  ? "bg-white dark:bg-slate-800 text-teal shadow-subtle"
                  : "text-text-secondary hover:text-primary dark:hover:text-white"
              }`}
            >
              Pick Platform Internship
            </button>
            <button
              onClick={() => setMode("custom_job")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === "custom_job"
                  ? "bg-white dark:bg-slate-800 text-teal shadow-subtle"
                  : "text-text-secondary hover:text-primary dark:hover:text-white"
              }`}
            >
              Paste Custom Role
            </button>
          </div>
        </div>

        {mode === "select_job" ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-text-secondary">
              Select an Internship to Target:
            </label>
            {jobs.length === 0 ? (
              <p className="text-xs text-text-muted">
                No published internships found. Switch to &ldquo;Paste Custom Role&rdquo; above.
              </p>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full rounded-2xl border border-border dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 px-4 py-3 text-sm text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.company_name} ({job.location || "Remote/Flexible"})
                  </option>
                ))}
              </select>
            )}

            {currentSelectedJob && (
              <div className="rounded-2xl border border-teal/20 bg-teal-light/20 dark:bg-teal/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-primary dark:text-white">
                    {currentSelectedJob.title}
                  </span>
                  <span className="text-text-muted"> · {currentSelectedJob.company_name}</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {currentSelectedJob.required_skills?.slice(0, 4).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-teal/30 text-teal font-mono text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-text-secondary shrink-0">
                  {currentSelectedJob.work_mode || "Work mode flexible"}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Target Role Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer Intern, Junior Data Scientist"
                value={customRoleTitle}
                onChange={(e) => setCustomRoleTitle(e.target.value)}
                className="w-full rounded-2xl border border-border dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 px-4 py-2.5 text-sm text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Job Description & Requirements
              </label>
              <textarea
                rows={4}
                placeholder="Paste the job description or bullet points of requirements here..."
                value={customJobDescription}
                onChange={(e) => setCustomJobDescription(e.target.value)}
                className="w-full rounded-2xl border border-border dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 px-4 py-2.5 text-sm text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>
        )}

        {/* CV Status Check */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border dark:border-slate-700">
          <div className="flex items-center gap-2.5 text-xs">
            <FileText className={`h-4 w-4 ${hasCv ? "text-emerald" : "text-amber-500"}`} />
            {hasCv ? (
              <span className="text-emerald-dark dark:text-emerald font-medium">
                CV ready for analysis (stored on profile)
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                No CV uploaded yet.{" "}
                <Link href="/applicant/resume" className="underline font-bold">
                  Upload a PDF CV first
                </Link>
              </span>
            )}
          </div>

          <Button
            onClick={handleOptimize}
            variant="gradient"
            disabled={!hasCv || loading}
            leftIcon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )
            }
          >
            {loading ? "Analyzing & Tailoring CV…" : "Run AI CV Optimization"}
          </Button>
        </div>
      </div>

      {/* ── STEP 2: OPTIMIZATION WORKSPACE ── */}
      {analysis && (
        <div className="space-y-6">
          {/* Overview Score Card */}
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className={`h-20 w-20 rounded-3xl border-2 flex flex-col items-center justify-center shrink-0 ${scoreTone}`}>
                <span className="font-display font-extrabold text-2xl">
                  {analysis.match_score}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Match %
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal">
                    Draft Version {analysis.version}
                  </span>
                  <span className="text-xs text-text-muted">•</span>
                  <span className="text-xs text-text-secondary font-medium">
                    {acceptedCount} of {totalSuggestions} suggestions accepted
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-primary dark:text-white">
                  Target: {analysis.target_role_title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                  {analysis.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveDraft(false)}
                disabled={saving}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                {saving ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveDraft(true)}
                disabled={saving}
                leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
              >
                New Version
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={exportAsPdf}
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Export PDF
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border dark:border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab("suggestions")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "suggestions"
                  ? "border-teal text-teal font-bold"
                  : "border-transparent text-text-secondary hover:text-primary dark:hover:text-white"
              }`}
            >
              <Wand2 className="h-4 w-4" />
              Tailoring Suggestions ({analysis.suggestions.length})
            </button>
            <button
              onClick={() => setActiveTab("evidence")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "evidence"
                  ? "border-teal text-teal font-bold"
                  : "border-transparent text-text-secondary hover:text-primary dark:hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4" />
              Evidence & Keywords
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "preview"
                  ? "border-teal text-teal font-bold"
                  : "border-transparent text-text-secondary hover:text-primary dark:hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              Live Preview & Export
            </button>
          </div>

          {/* ── TAB 1: SUGGESTIONS ── */}
          {activeTab === "suggestions" && (
            <div className="space-y-4">
              {/* Suggestion Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["all", "pending", "accepted", "rejected", "high"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSuggestionFilter(filter)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all font-medium ${
                        suggestionFilter === filter
                          ? "bg-teal text-white border-teal shadow-subtle"
                          : "border-border dark:border-slate-800 text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {filter === "all"
                        ? `All (${analysis.suggestions.length})`
                        : filter === "pending"
                        ? `Pending (${analysis.suggestions.filter((s) => s.status === "pending").length})`
                        : filter === "accepted"
                        ? `Accepted (${acceptedCount})`
                        : filter === "rejected"
                        ? `Rejected (${analysis.suggestions.filter((s) => s.status === "rejected").length})`
                        : `High Impact`}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-text-secondary font-mono">
                  {Math.round((acceptedCount / (totalSuggestions || 1)) * 100)}% Accepted
                </div>
              </div>

              {/* Suggestion Cards */}
              <div className="space-y-4">
                {filteredSuggestions.length === 0 ? (
                  <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-xs text-text-muted">
                    No suggestions match the &ldquo;{suggestionFilter}&rdquo; filter.
                  </div>
                ) : (
                  filteredSuggestions.map((s) => {
                    const isAccepted = s.status === "accepted";
                    const isRejected = s.status === "rejected";

                    return (
                      <div
                        key={s.id}
                        className={`rounded-3xl border transition-all p-5 sm:p-6 bg-white dark:bg-slate-800 shadow-card space-y-4 ${
                          isAccepted
                            ? "border-emerald/40 bg-emerald-light/10 dark:bg-emerald-500/5"
                            : isRejected
                            ? "border-border/60 opacity-60"
                            : "border-border dark:border-slate-700"
                        }`}
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {s.section}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal">
                              {s.category}
                            </span>
                            {s.impact === "high" && (
                              <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                High Impact
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isAccepted && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
                                <XCircle className="h-3.5 w-3.5" /> Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Comparison Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Original Text */}
                          <div className="p-3.5 rounded-2xl border border-border dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-text-muted block">
                              Original CV Text:
                            </span>
                            <p className="text-text-secondary leading-relaxed line-through-opacity">
                              {s.originalText || "No prior text (new suggested bullet)"}
                            </p>
                          </div>

                          {/* Suggested Tailored Text */}
                          <div className="p-3.5 rounded-2xl border border-teal/30 bg-teal-light/20 dark:bg-teal/10 space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-teal block">
                              Tailored Replacement:
                            </span>
                            {editingId === s.id ? (
                              <div className="space-y-2 mt-1">
                                <textarea
                                  rows={3}
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full rounded-xl border border-teal/40 bg-white dark:bg-slate-800 p-2 text-xs text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="gradient" onClick={() => handleSaveEdit(s.id)}>
                                    Save & Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="font-medium text-primary dark:text-white leading-relaxed">
                                {s.userEdit || s.suggestedText}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Rationale */}
                        <p className="text-xs text-text-secondary dark:text-slate-400 italic">
                          Why this helps: {s.explanation}
                        </p>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-slate-800">
                          <button
                            onClick={() => handleStartEdit(s)}
                            className="text-xs font-semibold text-text-secondary hover:text-teal flex items-center gap-1"
                          >
                            <Edit3 className="h-3 w-3" /> Customize Text
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateSuggestionStatus(s.id, "rejected")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                isRejected
                                  ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white"
                                  : "border border-border text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => updateSuggestionStatus(s.id, "accepted")}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                isAccepted
                                  ? "bg-emerald text-white shadow-subtle"
                                  : "bg-teal text-white hover:bg-teal-dark shadow-subtle"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" /> {isAccepted ? "Accepted" : "Accept Suggestion"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: EVIDENCE & KEYWORDS ── */}
          {activeTab === "evidence" && (
            <div className="space-y-6">
              {/* Keyword Analysis Box */}
              <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
                <h4 className="text-sm font-display font-bold text-primary dark:text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-teal" /> Target Keyword Match
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched */}
                  <div className="space-y-2 p-4 rounded-2xl bg-emerald-light/20 dark:bg-emerald-500/10 border border-emerald/20">
                    <span className="text-xs font-bold text-emerald-dark dark:text-emerald flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Present in Your CV ({analysis.keyword_analysis?.matchedKeywords?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysis.keyword_analysis?.matchedKeywords?.map((kw) => (
                        <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-emerald/30 text-emerald-dark dark:text-emerald">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing */}
                  <div className="space-y-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300/40">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Missing Keywords from Role ({analysis.keyword_analysis?.missingKeywords?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysis.keyword_analysis?.missingKeywords?.map((kw) => (
                        <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-amber-300 text-amber-700 dark:text-amber-300">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps Two-Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
                  <h4 className="text-sm font-display font-bold text-primary dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald" /> Supported Role Strengths
                  </h4>
                  <div className="space-y-3">
                    {analysis.strengths.map((st, i) => (
                      <div key={i} className="p-3.5 rounded-2xl border border-border dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                        <p className="font-semibold text-xs text-primary dark:text-white">
                          {st.title}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {st.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Gaps & Advice */}
                <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-4">
                  <h4 className="text-sm font-display font-bold text-primary dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Missing Evidence & Guidance
                  </h4>
                  <div className="space-y-3">
                    {analysis.missing_evidence.map((gap, i) => (
                      <div key={i} className="p-3.5 rounded-2xl border border-border dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                        <p className="font-semibold text-xs text-primary dark:text-white">
                          {gap.requirement}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {gap.gapDescription}
                        </p>
                        <p className="text-[11px] text-teal font-medium pt-1">
                          Tip: {gap.advice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: LIVE PREVIEW & EXPORT ── */}
          {activeTab === "preview" && optimizedPreviewSections && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-teal-light/20 dark:bg-teal/5 border border-teal/20 text-xs">
                <p className="text-text-secondary">
                  Preview includes all accepted improvements tailored for{" "}
                  <strong className="text-primary dark:text-white">{analysis.target_role_title}</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={copyMarkdown} leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}>
                    {copied ? "Copied" : "Copy Markdown"}
                  </Button>
                  <Button size="sm" variant="gradient" onClick={exportAsPdf} leftIcon={<Download className="h-3.5 w-3.5" />}>
                    Download Formatted PDF
                  </Button>
                </div>
              </div>

              {/* Visual CV Canvas */}
              <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto space-y-6 font-sans">
                {/* Header */}
                <div className="border-b border-border dark:border-slate-800 pb-6 text-center space-y-1">
                  <h2 className="text-2xl font-bold font-display text-primary dark:text-white">
                    {optimizedPreviewSections.name}
                  </h2>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal">
                    {optimizedPreviewSections.targetRole}
                  </p>
                  <p className="text-xs text-text-muted">
                    {[optimizedPreviewSections.email, optimizedPreviewSections.phone].filter(Boolean).join(" • ")}
                  </p>
                </div>

                {/* Summary */}
                {optimizedPreviewSections.summary && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-slate-300 border-b border-border/70 pb-1">
                      Professional Summary
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {optimizedPreviewSections.summary}
                    </p>
                  </div>
                )}

                {/* Technical Skills */}
                {optimizedPreviewSections.skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-slate-300 border-b border-border/70 pb-1">
                      Skills & Tools
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {optimizedPreviewSections.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {optimizedPreviewSections.experience.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-slate-300 border-b border-border/70 pb-1">
                      Experience & Practical Application
                    </h4>
                    <ul className="space-y-2 text-xs text-text-secondary list-disc pl-5">
                      {optimizedPreviewSections.experience.map((exp, i) => (
                        <li key={i} className="leading-relaxed">
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Projects */}
                {optimizedPreviewSections.projects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-slate-300 border-b border-border/70 pb-1">
                      Selected Projects
                    </h4>
                    <ul className="space-y-2 text-xs text-text-secondary list-disc pl-5">
                      {optimizedPreviewSections.projects.map((proj, i) => (
                        <li key={i} className="leading-relaxed">
                          {proj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Education */}
                {optimizedPreviewSections.education.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-slate-300 border-b border-border/70 pb-1">
                      Education
                    </h4>
                    <ul className="space-y-1 text-xs text-text-secondary list-disc pl-5">
                      {optimizedPreviewSections.education.map((edu, i) => (
                        <li key={i}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
