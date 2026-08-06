"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Send,
  XCircle,
  CalendarPlus,
  ClipboardCheck,
  CheckCircle2,
  Ban,
  PhoneMissed,
} from "lucide-react";
import { toast } from "sonner";
import {
  Interview,
  InterviewStatus as InterviewStatusType,
} from "@/lib/queries/interview";
import { recruiterInterviewAction } from "@/app/dashboard/applications/interviewActions";
import Tag from "@/components/ui/Tag";
import InterviewScheduler from "./InterviewScheduler";
import InterviewFeedback from "./InterviewFeedback";

interface InterviewStatusProps {
  interview?: Interview | null;
  applicationId: string;
  recruiterId: string;
  /** Pre-fetched applicant details to avoid DB queries when sending email */
  applicantName?: string;
  applicantEmail?: string;
  internshipTitle?: string;
  organizationName?: string;
}

export const INTERVIEW_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    tone:
      | "teal"
      | "amber"
      | "emerald"
      | "rose"
      | "neutral"
      | "purple"
      | "info";
    icon: typeof Calendar;
  }
> = {
  not_scheduled: {
    label: "Not Scheduled",
    tone: "neutral",
    icon: Calendar,
  },
  scheduled: {
    label: "Pending Response",
    tone: "amber",
    icon: CalendarCheck,
  },
  accepted: {
    label: "Accepted",
    tone: "teal",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    tone: "rose",
    icon: XCircle,
  },
  reschedule_requested: {
    label: "Reschedule Requested",
    tone: "amber",
    icon: Calendar,
  },
  completed: {
    label: "Completed",
    tone: "emerald",
    icon: ClipboardCheck,
  },
  cancelled: {
    label: "Cancelled",
    tone: "rose",
    icon: CalendarX,
  },
  missed: {
    label: "Missed",
    tone: "neutral",
    icon: PhoneMissed,
  },
  offer_sent: {
    label: "Offer Sent",
    tone: "purple",
    icon: Send,
  },
  rejected: {
    label: "Rejected",
    tone: "rose",
    icon: XCircle,
  },
};

export default function InterviewStatusComponent({
  interview,
  applicationId,
  recruiterId,
  applicantName,
  applicantEmail,
  internshipTitle,
  organizationName,
}: InterviewStatusProps) {
  const router = useRouter();

  const [showScheduler, setShowScheduler] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleUpdate = () => {
    router.refresh();
  };

  const runRecruiterAction = async (
    action: "approve_reschedule" | "reject_reschedule" | "cancel" | "complete" | "missed"
  ) => {
    if (!interview) return;
    // Cancelling emails the applicant — confirm before doing it.
    if (action === "cancel") {
      const ok = window.confirm(
        "Cancel this interview? The applicant will be notified by email."
      );
      if (!ok) return;
    }
    setPendingAction(action);
    try {
      const res = await recruiterInterviewAction(interview.id, action);
      if (res.success) {
        toast.success("Interview updated");
        handleUpdate();
      } else {
        toast.error(res.error || "Could not update the interview");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const status: InterviewStatusType =
    interview?.status || "not_scheduled";

  const config =
    INTERVIEW_STATUS_CONFIG[status] ??
    INTERVIEW_STATUS_CONFIG.not_scheduled;

  const StatusIcon = config.icon;

  const formatDate = (interview?: Interview | null) => {
    if (!interview) return "";
    return `${interview.interview_date} at ${interview.interview_time}`;
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          <Tag tone={config.tone}>{config.label}</Tag>
        </div>

        {interview && (status === "scheduled" || status === "accepted") && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5 pl-1"
          >
            <p className="text-xs font-medium text-text-primary">
              {formatDate(interview)}
            </p>

            {interview.interviewer_name && (
              <p className="text-xs text-text-secondary">
                With: {interview.interviewer_name}
              </p>
            )}

            {interview.meeting_link && (
              <a
                href={interview.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1"
              >
                Join Meeting →
              </a>
            )}

            {interview.notes && (
              <p className="text-xs text-text-muted italic mt-1">
                {interview.notes}
              </p>
            )}
          </motion.div>
        )}

        {status === "reschedule_requested" && interview && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5 rounded-xl border border-amber/30 bg-amber-50/60 dark:bg-amber/10 p-3"
          >
            <p className="text-xs font-semibold text-warning dark:text-amber-300">
              Applicant requested a new slot:
            </p>
            <p className="text-xs text-text-primary">
              {interview.reschedule_requested_date} at{" "}
              {interview.reschedule_requested_time}
            </p>
            {interview.reschedule_request_note && (
              <p className="text-xs text-text-muted italic">
                “{interview.reschedule_request_note}”
              </p>
            )}
            <p className="text-[11px] text-text-muted">
              Current slot: {formatDate(interview)}
            </p>
          </motion.div>
        )}

        {status === "declined" && interview?.decline_reason && (
          <p className="text-xs text-text-muted italic pl-1">
            Reason: {interview.decline_reason}
          </p>
        )}

        {interview &&
          status === "completed" &&
          interview.technical_rating !== null && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-border dark:border-slate-700"
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="font-mono text-[10px] text-text-muted block">
                    Technical
                  </span>
                  <span className="font-bold text-sm text-primary dark:text-white">
                    {interview.technical_rating}/5
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-text-muted block">
                    Comm.
                  </span>
                  <span className="font-bold text-sm text-primary dark:text-white">
                    {interview.communication_rating}/5
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-text-muted block">
                    Culture
                  </span>
                  <span className="font-bold text-sm text-primary dark:text-white">
                    {interview.culture_fit}/5
                  </span>
                </div>
              </div>

              {interview.overall_decision && (
                <div className="text-center mt-1">
                  <Tag
                    tone={
                      interview.overall_decision === "hire"
                        ? "teal"
                        : interview.overall_decision === "hold"
                        ? "amber"
                        : "rose"
                    }
                  >
                    {interview.overall_decision.toUpperCase()}
                  </Tag>
                </div>
              )}
            </motion.div>
          )}

        <div className="flex flex-wrap gap-2 pt-1">
          {status === "not_scheduled" && (
            <button
              onClick={() => setShowScheduler(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-light px-3 py-1.5 text-[11px] font-semibold text-teal-dark hover:bg-teal/20 transition-colors dark:bg-teal/20 dark:text-teal"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Schedule
            </button>
          )}

          {status === "reschedule_requested" && (
            <>
              <button
                onClick={() => runRecruiterAction("approve_reschedule")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-light px-3 py-1.5 text-[11px] font-semibold text-teal-dark hover:bg-teal/20 transition-colors dark:bg-teal/20 dark:text-teal disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {pendingAction === "approve_reschedule" ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={() => runRecruiterAction("reject_reschedule")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-danger hover:bg-rose-100 transition-colors dark:bg-rose-500/10 dark:text-rose-300 disabled:opacity-60"
              >
                <Ban className="h-3.5 w-3.5" />
                {pendingAction === "reject_reschedule" ? "Rejecting..." : "Reject"}
              </button>
            </>
          )}

          {(status === "scheduled" || status === "accepted") && (
            <>
              <button
                onClick={() => setShowScheduler(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white dark:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                Reschedule
              </button>

              <button
                onClick={() => runRecruiterAction("complete")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald/30 bg-emerald-light px-3 py-1.5 text-[11px] font-semibold text-emerald-dark hover:bg-emerald/20 transition-colors dark:bg-emerald/15 dark:text-emerald disabled:opacity-60"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                {pendingAction === "complete" ? "Completing..." : "Complete"}
              </button>

              <button
                onClick={() => runRecruiterAction("missed")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white dark:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-slate-300 disabled:opacity-60"
              >
                <PhoneMissed className="h-3.5 w-3.5" />
                Mark Missed
              </button>

              <button
                onClick={() => runRecruiterAction("cancel")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-danger hover:bg-rose-100 transition-colors dark:bg-rose-500/10 dark:text-rose-300 disabled:opacity-60"
              >
                <XCircle className="h-3.5 w-3.5" />
                {pendingAction === "cancel" ? "Cancelling..." : "Cancel"}
              </button>
            </>
          )}

          {(status === "scheduled" || status === "accepted") && (
            <button
              onClick={() => setShowFeedback(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-ai/30 bg-purple-light px-3 py-1.5 text-[11px] font-semibold text-purple-ai hover:bg-purple-ai/20 transition-colors dark:bg-purple-ai/20"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Add Feedback
            </button>
          )}
        </div>
      </div>

      <InterviewScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        applicationId={applicationId}
        recruiterId={recruiterId}
        onScheduled={handleUpdate}
        applicantName={applicantName}
        applicantEmail={applicantEmail}
        internshipTitle={internshipTitle}
        organizationName={organizationName}
      />

      <InterviewFeedback
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        applicationId={applicationId}
        onSubmitted={handleUpdate}
      />
    </>
  );
}