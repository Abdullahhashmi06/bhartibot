"use client";

import { motion } from "framer-motion";
import {
  Send,
  Bot,
  Eye,
  Clock,
  UserCheck,
  Video,
  Gift,
  XCircle,
  CheckCircle2,
} from "lucide-react";

type ApplicationStatus =
  | "new"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | string;

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  activeStatuses: string[];
  completedStatuses: string[];
  rejectedHere?: boolean;
}

const STEPS: TimelineStep[] = [
  {
    key: "applied",
    label: "Applied",
    description: "Application submitted",
    icon: <Send className="h-4 w-4" />,
    activeStatuses: ["new", "under_review", "shortlisted", "rejected"],
    completedStatuses: ["under_review", "shortlisted", "rejected"],
  },
  {
    key: "ai",
    label: "AI Evaluated",
    description: "Resume parsed and scored",
    icon: <Bot className="h-4 w-4" />,
    activeStatuses: ["new", "under_review", "shortlisted", "rejected"],
    completedStatuses: ["under_review", "shortlisted", "rejected"],
  },
  {
    key: "viewed",
    label: "Viewed",
    description: "Recruiter reviewed profile",
    icon: <Eye className="h-4 w-4" />,
    activeStatuses: ["under_review", "shortlisted", "rejected"],
    completedStatuses: ["under_review", "shortlisted", "rejected"],
  },
  {
    key: "review",
    label: "Under Review",
    description: "In recruiter pipeline",
    icon: <Clock className="h-4 w-4" />,
    activeStatuses: ["under_review", "shortlisted"],
    completedStatuses: ["shortlisted"],
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    description: "Selected for next stage",
    icon: <UserCheck className="h-4 w-4" />,
    activeStatuses: ["shortlisted"],
    completedStatuses: ["shortlisted"],
  },
  {
    key: "interview",
    label: "Interview",
    description: "Interview scheduled",
    icon: <Video className="h-4 w-4" />,
    activeStatuses: [],
    completedStatuses: [],
  },
  {
    key: "offer",
    label: "Offer",
    description: "Offer extended",
    icon: <Gift className="h-4 w-4" />,
    activeStatuses: [],
    completedStatuses: [],
  },
];

interface TimelineProps {
  status: ApplicationStatus;
  appliedAt?: string;
}

export default function Timeline({ status, appliedAt }: TimelineProps) {
  const isRejected = status === "rejected";

  function getStepState(step: TimelineStep) {
    if (step.completedStatuses.includes(status)) return "completed";
    if (step.activeStatuses.includes(status)) return "active";
    return "pending";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Recruitment Pipeline
        </span>
        {isRejected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-danger">
            <XCircle className="h-3 w-3" /> Application Rejected
          </span>
        )}
      </div>

      {/* Desktop horizontal timeline */}
      <div className="hidden sm:flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const state = isRejected && step.key === "review"
            ? "active" // show rejected marker after review
            : getStepState(step);
          const isLast = idx === STEPS.length - 1;

          return (
            <div
              key={step.key}
              className={`flex flex-col items-center ${isLast ? "" : "flex-1"}`}
            >
              <div className="flex items-center w-full">
                {/* Node */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    state === "completed"
                      ? "border-teal bg-teal text-white shadow-teal"
                      : state === "active"
                      ? isRejected && step.key === "review"
                        ? "border-danger bg-danger text-white"
                        : "border-teal bg-teal-light text-teal-dark"
                      : "border-border bg-white text-text-muted"
                  }`}
                >
                  {state === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isRejected && step.key === "review" ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </motion.div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 transition-all ${
                      state === "completed" ? "bg-teal" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <div className="mt-1.5 text-center max-w-[80px]">
                <span
                  className={`font-mono text-[9px] uppercase font-bold block ${
                    state === "completed"
                      ? "text-teal-dark"
                      : state === "active"
                      ? isRejected && step.key === "review"
                        ? "text-danger"
                        : "text-primary"
                      : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="flex sm:hidden flex-col gap-0">
        {STEPS.slice(0, 5).map((step, idx) => {
          const state = getStepState(step);
          const isLast = idx === 4;

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 ${
                    state === "completed"
                      ? "border-teal bg-teal text-white"
                      : state === "active"
                      ? "border-teal bg-teal-light text-teal-dark"
                      : "border-border bg-white text-text-muted"
                  }`}
                >
                  {state === "completed" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[20px] mt-0.5 ${
                      state === "completed" ? "bg-teal" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className="pb-3 pt-0.5">
                <span
                  className={`font-mono text-[10px] font-bold uppercase ${
                    state === "completed"
                      ? "text-teal-dark"
                      : state === "active"
                      ? "text-primary"
                      : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
                <p className="text-[10px] text-text-muted">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
