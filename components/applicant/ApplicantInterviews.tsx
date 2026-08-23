"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Phone,
  Link2,
  Copy,
  CalendarX,
  CheckCircle2,
  XCircle,
  CalendarClock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { INTERVIEW_STATUS_CONFIG } from "@/components/applications/InterviewStatus";
import { applicantRespondToInterviewAction } from "@/app/dashboard/applications/interviewActions";
import type { ApplicantInterview } from "@/lib/queries/interview";

interface ApplicantInterviewsProps {
  interviews: ApplicantInterview[];
}

const TYPE_LABELS: Record<string, string> = {
  online: "Online",
  on_site: "On-site",
  phone: "Phone",
};

type ModalMode = "decline" | "reschedule";

export default function ApplicantInterviews({
  interviews,
}: ApplicantInterviewsProps) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{
    mode: ModalMode;
    interview: ApplicantInterview;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [reqDate, setReqDate] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqNote, setReqNote] = useState("");

  const closeModal = () => {
    setModal(null);
    setReason("");
    setReqDate("");
    setReqTime("");
    setReqNote("");
  };

  const runAction = async (
    interview: ApplicantInterview,
    action: "accept" | "decline" | "reschedule",
    payload?: { reason?: string; date?: string; time?: string; note?: string }
  ) => {
    setPending(true);
    try {
      const res = await applicantRespondToInterviewAction(interview.id, action, payload);
      if (res.success) {
        toast.success(
          action === "accept"
            ? "Interview accepted!"
            : action === "decline"
              ? "Interview declined"
              : "Reschedule request sent"
        );
        closeModal();
        queryClient.invalidateQueries({ queryKey: ["applicant-dashboard"] });
      } else {
        toast.error(res.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const openModal = (mode: ModalMode, interview: ApplicantInterview) => {
    setModal({ mode, interview });
  };

  const submitModal = () => {
    if (!modal) return;
    if (modal.mode === "decline") {
      runAction(modal.interview, "decline", { reason: reason.trim() || undefined });
    } else {
      if (!reqDate || !reqTime) {
        toast.error("Please choose a preferred date and time");
        return;
      }
      runAction(modal.interview, "reschedule", {
        date: reqDate,
        time: reqTime,
        note: reqNote.trim() || undefined,
      });
    }
  };

  if (!interviews || interviews.length === 0) {
    return (
      <section className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-7 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal border border-teal/20">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-primary dark:text-white">
              Upcoming Interviews
            </h2>
            <p className="text-xs text-text-muted">Interview invitations will appear here</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CalendarX className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-text-secondary">
            No interviews scheduled yet. When a recruiter invites you, the
            details will show up here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-7 shadow-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal border border-teal/20">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-primary dark:text-white">
            Upcoming Interviews
          </h2>
          <p className="text-xs text-text-muted">
            Your interview invitations — respond to accept, decline, or reschedule
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {interviews.map((interview) => {
          const typeLabel = TYPE_LABELS[interview.interview_type] ?? "Interview";
          const config =
            INTERVIEW_STATUS_CONFIG[interview.status] ??
            INTERVIEW_STATUS_CONFIG.not_scheduled;

          const location =
            interview.interview_type === "online" && interview.meeting_link
              ? "Online — join via meeting link"
              : interview.interview_type === "on_site" && interview.venue
                ? interview.venue
                : interview.interview_type === "on_site"
                  ? "On-site — venue to be announced"
                  : "Phone interview";

          const canRespond =
            interview.status === "scheduled" || interview.status === "accepted";

          const handleCopy = async () => {
            if (!interview.meeting_link) return;
            try {
              await navigator.clipboard.writeText(interview.meeting_link);
              toast.success("Meeting link copied to clipboard");
            } catch {
              toast.error("Could not copy the link — please copy it manually");
            }
          };

          return (
            <div
              key={interview.id}
              className="group rounded-2xl border border-border dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4 sm:p-5 hover:border-teal/30 hover:shadow-subtle transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-base text-primary dark:text-white truncate">
                      {interview.internship_title || "Interview"}
                    </h3>
                    {interview.company_name && (
                      <span className="text-xs font-semibold text-text-secondary">
                        at {interview.company_name}
                      </span>
                    )}
                    <Tag tone={config.tone} className="text-[10px] px-2 py-0.5">
                      {config.label}
                    </Tag>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-teal" />
                      {interview.interview_date ?? "Date TBA"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-teal" />
                      {interview.interview_time ?? "Time TBA"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {interview.interview_type === "online" ? (
                        <Video className="h-3.5 w-3.5 text-teal" />
                      ) : interview.interview_type === "on_site" ? (
                        <MapPin className="h-3.5 w-3.5 text-teal" />
                      ) : (
                        <Phone className="h-3.5 w-3.5 text-teal" />
                      )}
                      {typeLabel}
                    </span>
                  </div>

                  <div className="mt-2 flex items-start gap-1.5 text-xs text-text-secondary dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                    <span className="break-words">{location}</span>
                  </div>

                  {interview.interviewer_name && (
                    <p className="mt-1.5 text-xs text-text-muted">
                      Interviewer: {interview.interviewer_name}
                    </p>
                  )}

                  {interview.notes && (
                    <p className="mt-2 text-xs text-text-muted italic border-l-2 border-teal/30 pl-2.5">
                      {interview.notes}
                    </p>
                  )}

                  {interview.status === "declined" && interview.decline_reason && (
                    <p className="mt-2 text-xs text-text-muted italic border-l-2 border-rose/30 pl-2.5">
                      Your reason: {interview.decline_reason}
                    </p>
                  )}

                  {interview.status === "reschedule_requested" && (
                    <div className="mt-2 rounded-lg border border-amber/30 bg-amber-50/60 dark:bg-amber/10 px-3 py-2 text-xs text-warning dark:text-amber-300">
                      You requested: {interview.reschedule_requested_date} at{" "}
                      {interview.reschedule_requested_time} — awaiting recruiter
                      approval
                      {interview.reschedule_request_note
                        ? ` (“${interview.reschedule_request_note}”)`
                        : ""}
                    </div>
                  )}
                </div>

                {interview.meeting_link && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-light px-3 py-2 text-[11px] font-semibold text-teal-dark hover:bg-teal/20 transition-colors dark:bg-teal/15 dark:text-teal"
                    title="Copy meeting link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </button>
                )}
              </div>

              {interview.meeting_link && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono text-[11px]">
                    {interview.meeting_link}
                  </span>
                </div>
              )}

              {canRespond && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border dark:border-slate-700 pt-3">
                  <button
                    onClick={() => runAction(interview, "accept")}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald/30 bg-emerald-light px-3 py-2 text-[11px] font-semibold text-emerald-dark hover:bg-emerald/20 transition-colors dark:bg-emerald/15 dark:text-emerald disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {pending ? "Sending..." : "Accept Interview"}
                  </button>
                  <button
                    onClick={() => openModal("decline", interview)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-danger hover:bg-rose-100 transition-colors dark:bg-rose-500/10 dark:text-rose-300 disabled:opacity-60"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Decline
                  </button>
                  <button
                    onClick={() => openModal("reschedule", interview)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white dark:bg-slate-800 px-3 py-2 text-[11px] font-semibold text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-slate-300 disabled:opacity-60"
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Request Reschedule
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RESPONSE MODAL */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
              role="dialog"
              aria-modal="true"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeModal();
              }}
            >
              <div className="flex min-h-full items-center justify-center px-4 py-6">
                <div className="w-full max-w-md rounded-3xl border border-border bg-white dark:bg-slate-900 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg text-primary dark:text-white">
                      {modal.mode === "decline"
                        ? "Decline Interview"
                        : "Request Reschedule"}
                    </h3>
                    <button
                      onClick={closeModal}
                      className="rounded-lg p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {modal.mode === "decline" ? (
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Reason <span className="text-text-muted/50">(optional)</span>
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Tell the recruiter why you're declining..."
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white resize-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Preferred Date <span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                              .toISOString()
                              .split("T")[0]}
                            value={reqDate}
                            onChange={(e) => setReqDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Preferred Time <span className="text-danger">*</span>
                          </label>
                          <input
                            type="time"
                            value={reqTime}
                            onChange={(e) => setReqTime(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Message <span className="text-text-muted/50">(optional)</span>
                        </label>
                        <textarea
                          value={reqNote}
                          onChange={(e) => setReqNote(e.target.value)}
                          rows={2}
                          maxLength={1000}
                          placeholder="Anything the recruiter should know..."
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={closeModal}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-white dark:bg-slate-800 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={submitModal}
                      variant={modal.mode === "decline" ? "danger" : "gradient"}
                      size="md"
                      isLoading={pending}
                    >
                      {modal.mode === "decline" ? "Decline Interview" : "Send Request"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
