"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  User,
  Link,
  FileText,
  X,
  CalendarPlus,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upsertInterviewSchedule, InterviewType } from "@/lib/queries/interview";
import { sendInterviewEmailAction } from "@/app/dashboard/applications/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface InterviewSchedulerProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  recruiterId: string;
  onScheduled: () => void;
  /** Pre-fetched applicant details to avoid DB queries when sending email */
  applicantName?: string;
  applicantEmail?: string;
  internshipTitle?: string;
  organizationName?: string;
}

const interviewTypes: { value: InterviewType; label: string; icon: typeof Video }[] = [
  { value: "online", label: "Online", icon: Video },
  { value: "on_site", label: "On-site", icon: MapPin },
  { value: "phone", label: "Phone", icon: Phone },
];

export default function InterviewScheduler({
  open,
  onClose,
  applicationId,
  recruiterId,
  onScheduled,
  applicantName,
  applicantEmail,
  internshipTitle,
  organizationName,
}: InterviewSchedulerProps) {
  const supabase = createClient();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [type, setType] = useState<InterviewType>("online");
  const [interviewerName, setInterviewerName] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSchedule() {
    if (!date || !time || !interviewerName.trim()) {
      toast.error("Please fill in date, time, and interviewer name");
      return;
    }

    // No hard meeting link validation - allows scheduling first and providing link later

    setIsPending(true);
    const { error } = await upsertInterviewSchedule(supabase, applicationId, recruiterId, {
      interview_date: date,
      interview_time: time,
      interview_type: type,
      interviewer_name: interviewerName.trim(),
      meeting_link: meetingLink.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Fire-and-forget email notification (do not block on failure)
    if (!error) {
      sendInterviewEmailAction({
        applicationId,
        interviewDate: date,
        interviewTime: time,
        timezone,
        interviewType: type,
        meetingLink: meetingLink.trim() || null,
        venue: venue.trim() || null,
        notes: notes.trim() || null,
        interviewerName: interviewerName.trim() || null,
        // Pass pre-fetched details to avoid DB queries (makes email resilient to DB outages)
        applicantName: applicantName,
        applicantEmail: applicantEmail,
        internshipTitle: internshipTitle,
        organizationName: organizationName,
      }).then((result) => {
        if (result?.skipped) {
          console.warn("[InterviewScheduler] Email skipped (SMTP not configured)");
          toast.warning(
            "Interview scheduled — email notification not sent because SMTP isn't configured.",
            { duration: 6000 }
          );
        } else if (!result?.success) {
          console.error("[InterviewScheduler] Email notification failed but interview was scheduled");
        }
      });
    }

    setIsPending(false);

    if (error) {
      toast.error(`Failed to schedule: ${error}`);
    } else {
      toast.success("Interview scheduled successfully");
      onScheduled();
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-3xl border border-border bg-white dark:bg-slate-900 p-6 shadow-hover space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-light text-purple-ai border border-purple-ai/20 dark:bg-purple-ai/20">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-primary dark:text-white">
                      Schedule Interview
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Set up interview details for this candidate
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="interview-date" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        id="interview-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="interview-time" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        id="interview-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Interview Type
                  </span>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Interview type">
                    {interviewTypes.map((it) => {
                      const Icon = it.icon;
                      const isActive = type === it.value;
                      return (
                        <button
                          key={it.value}
                          onClick={() => setType(it.value)}
                          role="radio"
                          aria-checked={isActive}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                            isActive
                              ? "border-teal bg-teal-light text-teal-dark dark:bg-teal/20 dark:text-teal"
                              : "border-border bg-slate-50 dark:bg-slate-800 text-text-secondary hover:border-teal/30 dark:hover:border-teal/30"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {it.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="interviewer-name" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Interviewer Name <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      id="interviewer-name"
                      type="text"
                      value={interviewerName}
                      onChange={(e) => setInterviewerName(e.target.value)}
                      placeholder="e.g., Sarah Ahmed"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <label htmlFor="timezone" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Timezone <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      id="timezone"
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="e.g., America/New_York"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="meeting-link" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Meeting Link <span className="text-text-muted/50">(optional)</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      id="meeting-link"
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                    />
                  </div>
                </div>

                {/* Venue (shown when on-site) */}
                {type === "on_site" && (
                  <div className="space-y-1.5">
                    <label htmlFor="venue" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Venue / Location <span className="text-text-muted/50">(optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        id="venue"
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g., Room 401, Main Office"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="interview-notes" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Notes <span className="text-text-muted/50">(optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                    <textarea
                      id="interview-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes for the interview..."
                      rows={3}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-white dark:bg-slate-800 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSchedule}
                  variant="gradient"
                  size="md"
                  isLoading={isPending}
                  leftIcon={<CalendarPlus className="h-4 w-4" />}
                >
                  Schedule Interview
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
