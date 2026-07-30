"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  X,
  ClipboardCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitInterviewFeedback, OverallDecision } from "@/lib/queries/interview";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface InterviewFeedbackProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  onSubmitted: () => void;
}

const ratingLabels = ["Poor", "Below Avg", "Average", "Good", "Excellent"];

const decisions: { value: OverallDecision; label: string; color: string }[] = [
  { value: "hire", label: "Hire", color: "bg-emerald text-white border-emerald" },
  { value: "hold", label: "Hold", color: "bg-warning text-white border-warning" },
  { value: "reject", label: "Reject", color: "bg-danger text-white border-danger" },
];

export default function InterviewFeedback({
  open,
  onClose,
  applicationId,
  onSubmitted,
}: InterviewFeedbackProps) {
  const supabase = createClient();
  const [technical, setTechnical] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [cultureFit, setCultureFit] = useState(0);
  const [recommendation, setRecommendation] = useState("");
  const [decision, setDecision] = useState<OverallDecision | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    if (!decision) {
      toast.error("Please select an overall decision");
      return;
    }
    if (technical === 0 || communication === 0 || cultureFit === 0) {
      toast.error("Please provide all ratings");
      return;
    }

    setIsPending(true);
    const { error } = await submitInterviewFeedback(supabase, applicationId, {
      technical_rating: technical,
      communication_rating: communication,
      culture_fit: cultureFit,
      overall_recommendation: recommendation.trim(),
      overall_decision: decision,
      feedback_notes: feedbackNotes.trim() || undefined,
    });
    setIsPending(false);

    if (error) {
      toast.error(`Failed to submit feedback: ${error}`);
    } else {
      toast.success("Interview feedback submitted");
      onSubmitted();
      onClose();
    }
  }

  function RatingSelector({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) {
    return (
      <div className="space-y-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange(star === value ? 0 : star)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                star <= value
                  ? "text-amber-400 scale-110"
                  : "text-slate-200 dark:text-slate-600 hover:text-amber-300"
              )}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  star <= value ? "fill-amber-400" : "fill-none"
                )}
              />
            </button>
          ))}
          {value > 0 && (
            <span className="ml-1 text-xs font-medium text-text-secondary">
              {ratingLabels[value - 1]}
            </span>
          )}
        </div>
      </div>
    );
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal-dark border border-teal/20 dark:bg-teal/20">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-primary dark:text-white">
                      Interview Feedback
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Rate the candidate&apos;s interview performance
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

              <div className="space-y-5">
                <RatingSelector label="Technical Rating" value={technical} onChange={setTechnical} />
                <RatingSelector label="Communication Rating" value={communication} onChange={setCommunication} />
                <RatingSelector label="Culture Fit" value={cultureFit} onChange={setCultureFit} />

                <div className="space-y-1.5">
                  <label htmlFor="feedback-recommendation" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Overall Recommendation
                  </label>
                  <textarea
                    id="feedback-recommendation"
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Brief recommendation summary..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal dark:text-white resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Overall Decision
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {decisions.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDecision(d.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all",
                          decision === d.value
                            ? d.color
                            : "border-border bg-slate-50 dark:bg-slate-800 text-text-secondary hover:border-slate-300"
                        )}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feedback-notes" className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Notes <span className="text-text-muted/50">(optional)</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                    <textarea
                      id="feedback-notes"
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Detailed feedback notes..."
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
                  onClick={handleSubmit}
                  variant="gradient"
                  size="md"
                  isLoading={isPending}
                  leftIcon={<ClipboardCheck className="h-4 w-4" />}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
