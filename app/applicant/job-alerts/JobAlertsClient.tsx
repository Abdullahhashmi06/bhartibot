"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  Briefcase,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Laptop,
  Check,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  JobAlert,
  CreateJobAlertInput,
  JobAlertMatch,
  ApplicantFeedItem,
  JobAlertChannel,
  JobAlertFrequency,
} from "@/lib/types";
import { toast } from "sonner";
import { evaluateJobAlertMatch } from "@/lib/queries/job-alerts";

interface Props {
  initialAlerts: JobAlert[];
  jobs: ApplicantFeedItem[];
}

export default function JobAlertsClient({ initialAlerts, jobs }: Props) {
  const [alerts, setAlerts] = useState<JobAlert[]>(initialAlerts);
  const [scanning, setScanning] = useState(false);
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<string>("all");

  // Browser notification permission state
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  async function requestBrowserPermission() {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not supported in this browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === "granted") {
        toast.success("Browser notifications enabled!");
      } else {
        toast.error("Browser notifications were declined.");
      }
    } catch {
      toast.error("Could not request notification permissions.");
    }
  }

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [formCompanies, setFormCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formWorkMode, setFormWorkMode] = useState<string>("any");
  const [formThreshold, setFormThreshold] = useState<number>(60);
  const [formFrequency, setFormFrequency] = useState<JobAlertFrequency>("instant");
  const [formChannels, setFormChannels] = useState<JobAlertChannel[]>(["in_app", "browser"]);

  function openCreateModal() {
    setEditingAlertId(null);
    setFormTitle("");
    setFormRole("");
    setFormSkills([]);
    setFormCompanies([]);
    setFormLocation("");
    setFormWorkMode("any");
    setFormThreshold(60);
    setFormFrequency("instant");
    setFormChannels(["in_app", "browser"]);
    setModalOpen(true);
  }

  function openEditModal(alert: JobAlert) {
    setEditingAlertId(alert.id);
    setFormTitle(alert.title);
    setFormRole(alert.target_role || "");
    setFormSkills(alert.skills || []);
    setFormCompanies(alert.companies || []);
    setFormLocation(alert.location || "");
    setFormWorkMode(alert.work_mode || "any");
    setFormThreshold(alert.match_threshold || 60);
    setFormFrequency(alert.frequency || "instant");
    setFormChannels(alert.channels || ["in_app"]);
    setModalOpen(true);
  }

  function addSkillTag() {
    const trimmed = skillInput.trim();
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills([...formSkills, trimmed]);
      setSkillInput("");
    }
  }

  function removeSkillTag(s: string) {
    setFormSkills(formSkills.filter((item) => item !== s));
  }

  function addCompanyTag() {
    const trimmed = companyInput.trim();
    if (trimmed && !formCompanies.includes(trimmed)) {
      setFormCompanies([...formCompanies, trimmed]);
      setCompanyInput("");
    }
  }

  function removeCompanyTag(c: string) {
    setFormCompanies(formCompanies.filter((item) => item !== c));
  }

  function toggleChannel(ch: JobAlertChannel) {
    if (formChannels.includes(ch)) {
      if (formChannels.length === 1) {
        toast.error("At least one notification channel must be selected.");
        return;
      }
      setFormChannels(formChannels.filter((c) => c !== ch));
    } else {
      setFormChannels([...formChannels, ch]);
    }
  }

  // Save (Create or Update) Alert
  async function handleSaveAlert() {
    if (!formTitle.trim()) {
      toast.error("Please provide an alert name.");
      return;
    }

    const payload: CreateJobAlertInput = {
      title: formTitle.trim(),
      target_role: formRole.trim() || undefined,
      skills: formSkills,
      companies: formCompanies,
      location: formLocation.trim() || undefined,
      work_mode: formWorkMode,
      match_threshold: formThreshold,
      frequency: formFrequency,
      channels: formChannels,
    };

    try {
      if (editingAlertId) {
        const res = await fetch(`/api/applicant/job-alerts/${editingAlertId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        setAlerts((prev) =>
          prev.map((a) => (a.id === editingAlertId ? json.data : a))
        );
        toast.success("Job alert updated!");
      } else {
        const res = await fetch("/api/applicant/job-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        setAlerts((prev) => [json.data, ...prev]);
        toast.success("New job alert created!");
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save job alert.");
    }
  }

  // Toggle Alert Active/Paused
  async function toggleAlertActive(alert: JobAlert) {
    const updatedState = !alert.is_active;
    try {
      const res = await fetch(`/api/applicant/job-alerts/${alert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: updatedState }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, is_active: updatedState } : a))
      );
      toast.success(updatedState ? `"${alert.title}" activated` : `"${alert.title}" paused`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update alert status.");
    }
  }

  // Delete Alert
  async function handleDeleteAlert(id: string) {
    try {
      const res = await fetch(`/api/applicant/job-alerts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete alert.");
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAlertFilter === id) setSelectedAlertFilter("all");
      toast.success("Alert deleted.");
    } catch {
      toast.error("Failed to delete alert.");
    }
  }

  // Run Immediate Scan across all published jobs
  async function handleScanMatches() {
    setScanning(true);
    try {
      const res = await fetch("/api/applicant/job-alerts/scan", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      // Trigger browser notification for newly found matches if permitted
      if (
        browserPermission === "granted" &&
        Array.isArray(data.matches) &&
        data.matches.length > 0
      ) {
        data.matches.slice(0, 3).forEach((m: JobAlertMatch) => {
          const job = m.internship;
          if (job) {
            new Notification(`Job Alert Match: ${job.title}`, {
              body: `${job.company_name} · ${m.match_reasons[0] || "Matches your preferences"}`,
              icon: "/favicon-32.png",
            });
          }
        });
      }

      toast.success(
        data.newMatchesCount > 0
          ? `Discovered ${data.newMatchesCount} new matching opportunities!`
          : "Scan completed. All current opportunities evaluated."
      );
    } catch (err: any) {
      toast.error(err.message || "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  // Compute live matches for display
  const allEvaluatedMatches = useMemo(() => {
    const list: { alert: JobAlert; job: ApplicantFeedItem; score: number; reasons: string[] }[] = [];
    const targetAlerts =
      selectedAlertFilter === "all"
        ? alerts.filter((a) => a.is_active)
        : alerts.filter((a) => a.id === selectedAlertFilter);

    targetAlerts.forEach((alert) => {
      jobs.forEach((job) => {
        const res = evaluateJobAlertMatch(alert, job);
        if (res.isMatch) {
          list.push({
            alert,
            job,
            score: res.score,
            reasons: res.reasons,
          });
        }
      });
    });

    // Deduplicate by job id if viewing "all", keeping highest score
    if (selectedAlertFilter === "all") {
      const map = new Map<string, { alert: JobAlert; job: ApplicantFeedItem; score: number; reasons: string[] }>();
      list.forEach((item) => {
        const existing = map.get(item.job.id);
        if (!existing || item.score > existing.score) {
          map.set(item.job.id, item);
        }
      });
      return Array.from(map.values()).sort((a, b) => b.score - a.score);
    }

    return list.sort((a, b) => b.score - a.score);
  }, [alerts, jobs, selectedAlertFilter]);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-light/60 dark:bg-teal/20 border border-teal/30 px-3 py-1 text-xs font-mono font-semibold text-teal-dark dark:text-teal mb-2">
            <Bell className="h-3.5 w-3.5" /> Automated Opportunity Discovery
          </div>
          <h1 className="text-3xl font-display font-extrabold text-primary dark:text-white">
            Job Alerts & Notifications
          </h1>
          <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">
            Receive automatic in-app and browser notifications as soon as recruiters publish roles matching your target title, skills, and preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanMatches}
            disabled={scanning}
            leftIcon={
              scanning ? (
                <RefreshCw className="h-4 w-4 animate-spin text-teal" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
          >
            {scanning ? "Scanning…" : "Scan For Matches Now"}
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Job Alert
          </Button>
        </div>
      </div>

      {/* ── NOTIFICATION CHANNELS BAR ── */}
      <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-border/70 dark:border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-teal-light dark:bg-teal/20 text-teal flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary dark:text-white">In-App Notifications</p>
            <p className="text-[11px] text-emerald font-semibold flex items-center gap-1">
              <Check className="h-3 w-3" /> Active on top bell
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-border/70 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary dark:text-white">Browser Alerts</p>
              <p className="text-[11px] text-text-secondary truncate">
                {browserPermission === "granted" ? "Granted" : "Permission required"}
              </p>
            </div>
          </div>
          {browserPermission !== "granted" && (
            <button
              onClick={requestBrowserPermission}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal text-white hover:bg-teal-dark shrink-0"
            >
              Enable
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-border/70 dark:border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-emerald-light dark:bg-emerald-500/20 text-emerald-dark dark:text-emerald flex items-center justify-center shrink-0">
            <Send className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary dark:text-white">Email Digest</p>
            <p className="text-[11px] text-text-secondary">Instant / Daily options</p>
          </div>
        </div>
      </div>

      {/* ── CONFIGURED ALERTS SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-primary dark:text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-teal" /> Your Active Alert Rules ({alerts.length})
          </h2>
          {alerts.length > 0 && (
            <button
              onClick={openCreateModal}
              className="text-xs font-semibold text-teal hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Another Alert
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-10 text-center space-y-3">
            <Bell className="h-8 w-8 text-teal mx-auto" />
            <h3 className="font-display font-bold text-base text-primary dark:text-white">
              No Job Alerts Configured Yet
            </h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Create an alert for your preferred internship role, tools, or location. InternIQ will monitor openings and alert you as soon as they go live.
            </p>
            <Button variant="gradient" size="sm" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
              Configure First Alert
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-3xl border p-5 bg-white dark:bg-slate-800 shadow-card space-y-4 transition-all ${
                  alert.is_active
                    ? "border-border dark:border-slate-700"
                    : "border-border/60 opacity-60 bg-slate-50/50 dark:bg-slate-900/40"
                }`}
              >
                {/* Header & Status Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-primary dark:text-white truncate">
                        {alert.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal">
                        ≥ {alert.match_threshold}%
                      </span>
                    </div>
                    {alert.target_role && (
                      <p className="text-xs font-semibold text-teal truncate">
                        Role: {alert.target_role}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleAlertActive(alert)}
                      className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                        alert.is_active
                          ? "bg-emerald/10 text-emerald hover:bg-emerald/20"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                      }`}
                      title={alert.is_active ? "Pause Alert" : "Resume Alert"}
                    >
                      {alert.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(alert)}
                      className="p-2 rounded-xl text-text-secondary hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                      title="Edit Alert"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 rounded-xl text-text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      title="Delete Alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Criteria Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {alert.work_mode !== "any" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      <Briefcase className="h-3 w-3 text-text-muted" /> {alert.work_mode}
                    </span>
                  )}
                  {alert.location && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      <MapPin className="h-3 w-3 text-text-muted" /> {alert.location}
                    </span>
                  )}
                  {alert.skills?.map((sk) => (
                    <span key={sk} className="px-2 py-0.5 rounded-md bg-teal-light/40 dark:bg-teal/10 text-teal-dark dark:text-teal font-mono text-[10px]">
                      {sk}
                    </span>
                  ))}
                  {alert.companies?.map((cp) => (
                    <span key={cp} className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                      {cp}
                    </span>
                  ))}
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 dark:border-slate-800 text-[11px] text-text-secondary">
                  <span>
                    Channels: {alert.channels?.join(", ") || "in_app"}
                  </span>
                  <span className="font-mono">
                    {alert.frequency} frequency
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MATCHING OPPORTUNITIES FEED ── */}
      <div className="space-y-4 pt-4 border-t border-border dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-display font-bold text-primary dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal" /> Matched Opportunities
            </h2>
            <p className="text-xs text-text-secondary">
              Published roles satisfying your active alert criteria and thresholds.
            </p>
          </div>

          {/* Filter dropdown by alert */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Filter by Alert:</span>
            <select
              value={selectedAlertFilter}
              onChange={(e) => setSelectedAlertFilter(e.target.value)}
              className="rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-primary dark:text-white"
            >
              <option value="all">All Active Alerts ({allEvaluatedMatches.length} matches)</option>
              {alerts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {allEvaluatedMatches.length === 0 ? (
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center space-y-2">
            <Briefcase className="h-7 w-7 text-text-muted mx-auto" />
            <p className="text-sm font-semibold text-primary dark:text-white">
              No matching open internships found for current alert criteria.
            </p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Try adjusting the match threshold or adding more skills, or click &ldquo;Scan For Matches Now&rdquo; to refresh.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEvaluatedMatches.map(({ alert, job, score, reasons }) => {
              const scoreColor =
                score >= 80 ? "text-emerald border-emerald/30 bg-emerald/10" : "text-teal border-teal/30 bg-teal/10";

              return (
                <div
                  key={`${alert.id}-${job.id}`}
                  className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-card space-y-4 hover:border-teal/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Title, Company, Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal">
                          Matched via &ldquo;{alert.title}&rdquo;
                        </span>
                        <h3 className="font-display font-bold text-base text-primary dark:text-white mt-0.5">
                          {job.title}
                        </h3>
                        <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-text-muted" /> {job.company_name}
                          {job.location && ` · ${job.location}`}
                        </p>
                      </div>

                      <div className={`h-12 w-12 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${scoreColor}`}>
                        <span className="font-display font-extrabold text-sm">{score}%</span>
                        <span className="text-[8px] font-mono uppercase font-bold">Match</span>
                      </div>
                    </div>

                    {/* WHY THIS MATCHED EXPLANATION BOX */}
                    <div className="p-3 rounded-2xl bg-teal-light/20 dark:bg-teal/5 border border-teal/20 space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal block flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Why It Matched:
                      </span>
                      <ul className="text-xs text-text-secondary dark:text-slate-300 space-y-0.5 list-disc pl-4">
                        {reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Skill chips */}
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills?.slice(0, 4).map((sk) => (
                        <span key={sk} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border/50 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {job.work_mode || "Work mode flexible"}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={job.public_slug ? `/internships/${job.public_slug}` : "/applicant/internships"}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal hover:bg-teal-light/40 transition-all"
                      >
                        View Role <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Link
                        href={job.public_slug ? `/apply/${job.public_slug}` : `/applicant/internships`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal text-white hover:bg-teal-dark shadow-subtle transition-all"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT ALERT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-primary dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-teal" />
                {editingAlertId ? "Edit Job Alert" : "Create New Job Alert"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-muted hover:text-primary dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Alert Title */}
              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  Alert Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote Frontend Roles, Islamabad AI Opportunities"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-2xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              {/* Target Role */}
              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  Target Role Title / Keyword
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Machine Learning, UI/UX"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-2xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              {/* Target Skills Tags */}
              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  Target Skills (type skill and press Add)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. React, Python, Docker"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkillTag();
                      }
                    }}
                    className="flex-1 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button
                    type="button"
                    onClick={addSkillTag}
                    className="px-3 py-2 rounded-xl bg-teal text-white font-semibold text-xs hover:bg-teal-dark"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-teal-light/60 dark:bg-teal/20 text-teal-dark dark:text-teal"
                    >
                      {sk}
                      <button type="button" onClick={() => removeSkillTag(sk)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Companies */}
              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  Preferred Companies (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Google, Devsinc, Systems Limited"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCompanyTag();
                      }
                    }}
                    className="flex-1 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button
                    type="button"
                    onClick={addCompanyTag}
                    className="px-3 py-2 rounded-xl bg-teal text-white font-semibold text-xs hover:bg-teal-dark"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formCompanies.map((cp) => (
                    <span
                      key={cp}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    >
                      {cp}
                      <button type="button" onClick={() => removeCompanyTag(cp)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Mode & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    Work Mode
                  </label>
                  <select
                    value={formWorkMode}
                    onChange={(e) => setFormWorkMode(e.target.value)}
                    className="w-full rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-white"
                  >
                    <option value="any">Any Work Mode</option>
                    <option value="remote">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-Site</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    Location Preference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Islamabad, Lahore"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-white"
                  />
                </div>
              </div>

              {/* Match Threshold Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-text-secondary">
                    Match Threshold:
                  </label>
                  <span className="font-mono font-bold text-teal text-sm">
                    {formThreshold}% or higher
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="5"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(Number(e.target.value))}
                  className="w-full accent-teal"
                />
              </div>

              {/* Frequency & Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/70 dark:border-slate-800">
                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    Delivery Frequency
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as JobAlertFrequency)}
                    className="w-full rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-white"
                  >
                    <option value="instant">Instant (as soon as published)</option>
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    Notification Channels
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(["in_app", "browser", "email"] as JobAlertChannel[]).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          formChannels.includes(ch)
                            ? "bg-teal text-white border-teal shadow-subtle"
                            : "border-border text-text-secondary"
                        }`}
                      >
                        {ch === "in_app" ? "In-App" : ch === "browser" ? "Browser" : "Email"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={handleSaveAlert}>
                {editingAlertId ? "Update Alert" : "Save Job Alert"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
