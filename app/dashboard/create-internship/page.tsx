"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Sparkles, Trash2, ListChecks, HelpCircle, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import RequirementList from "@/components/internships/RequirementList";
import QuestionList from "@/components/internships/QuestionList";
import { createClient } from "@/lib/supabase/client";
import { createInternship } from "@/lib/queries/internships";
import { FIELD_OPTIONS, WorkMode, QuestionType } from "@/lib/types";

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "on-site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

export default function CreateInternshipPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [field, setField] = useState(FIELD_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("on-site");
  const [duration, setDuration] = useState("");
  const [required, setRequired] = useState<string[]>(["Python"]);
  const [preferred, setPreferred] = useState<string[]>(["Pandas"]);
  const [questions, setQuestions] = useState<
    {
      question: string;
      type: QuestionType;
    }[]
  >([
    {
      question: "Have you completed coursework in machine learning or statistics?",
      type: "YES_NO",
    },
  ]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  function validateStep1() {
    if (!title.trim() || !location.trim() || !duration.trim()) {
      setError("Role Title, Location, and Duration are required.");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !location.trim() || !duration.trim()) {
      setError("Title, location, and duration are required.");
      setStep(1);
      return;
    }

    setStatus("loading");

    const requirements = [
      ...required
        .filter((r) => r.trim())
        .map((r) => ({ requirement: r.trim(), type: "required" as const })),
      ...preferred
        .filter((r) => r.trim())
        .map((r) => ({ requirement: r.trim(), type: "preferred" as const })),
    ];

    const { error: createError } = await createInternship(supabase, {
      title: title.trim(),
      field,
      description: description.trim(),
      location: location.trim(),
      work_mode: workMode,
      duration: duration.trim(),
      requirements,
    });

    setStatus("idle");

    if (createError) {
      setError(createError);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <Tag tone="teal">Role Stepper Wizard</Tag>
            <h1 className="mt-2 font-display font-extrabold text-3xl text-primary tracking-tight">
              Create New Internship Drive
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              Define role parameters, candidate requirements, and custom screening questions for AI parsing.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Cancel
          </Button>
        </div>

        {/* STEPPER PROGRESS INDICATOR */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-white p-4 shadow-subtle">
          <StepperTab
            stepNumber={1}
            active={step === 1}
            completed={step > 1}
            label="1. Role Overview"
            onClick={() => setStep(1)}
          />
          <StepperTab
            stepNumber={2}
            active={step === 2}
            completed={step > 2}
            label="2. Requirements"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
          />
          <StepperTab
            stepNumber={3}
            active={step === 3}
            completed={false}
            label="3. Screening Questions"
            onClick={() => {
              if (validateStep1()) setStep(3);
            }}
          />
        </div>

        {error && <FormNotice tone="error">{error}</FormNotice>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: BASIC ROLE DETAILS */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Briefcase className="h-5 w-5 text-teal" />
                <h2 className="font-display font-bold text-lg text-primary">
                  Step 1 — General Role Information
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary">
                    Internship Role Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Machine Learning Engineering Intern"
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-4 py-2.5 text-sm text-text-primary focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Industry / Field
                    </label>
                    <select
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary focus:border-teal focus:bg-white focus:outline-none"
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Location <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Islamabad or Remote"
                      className="w-full rounded-xl border border-border bg-slate-50/50 px-4 py-2.5 text-sm text-text-primary focus:border-teal focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Work Mode
                    </label>
                    <div className="flex gap-2">
                      {WORK_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setWorkMode(mode.value)}
                          className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                            workMode === mode.value
                              ? "border-teal bg-teal-light text-teal-dark shadow-subtle"
                              : "border-border bg-slate-50 text-text-secondary hover:border-slate-300"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Duration <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 8 - 12 Weeks"
                      className="w-full rounded-xl border border-border bg-slate-50/50 px-4 py-2.5 text-sm text-text-primary focus:border-teal focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary">
                    Description & Objectives
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Outline key learning outcomes, responsibilities, and expected impact..."
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-4 py-2.5 text-sm text-text-primary focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="gradient"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Requirements
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: REQUIREMENTS & CHIPS */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <ListChecks className="h-5 w-5 text-purple-ai" />
                <h2 className="font-display font-bold text-lg text-primary">
                  Step 2 — Define Candidate Requirements
                </h2>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Specify skills and qualifications for automated AI resume evaluation and evidence scoring.
              </p>

              <div className="space-y-6">
                <RequirementList
                  label="Required Skills & Competencies"
                  tone="amber"
                  items={required}
                  onChange={setRequired}
                  placeholder="e.g. Python, PyTorch, SQL"
                />
                <RequirementList
                  label="Preferred / Bonus Skills"
                  tone="teal"
                  items={preferred}
                  onChange={setPreferred}
                  placeholder="e.g. Docker, Git, MLflow"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Screening Questions
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SCREENING QUESTIONS */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <HelpCircle className="h-5 w-5 text-emerald" />
                <h2 className="font-display font-bold text-lg text-primary">
                  Step 3 — Custom Screening Questions
                </h2>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Add optional questions applicants answer during submission to give your team instant clarity.
              </p>

              <QuestionList items={questions} onChange={setQuestions} />

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  isLoading={status === "loading"}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Create & Launch Role
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </Shell>
  );
}

function StepperTab({
  stepNumber,
  active,
  completed,
  label,
  onClick,
}: {
  stepNumber: number;
  active: boolean;
  completed: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
        active
          ? "bg-gradient-primary text-white shadow-teal"
          : completed
          ? "bg-emerald-light text-emerald border border-emerald/30"
          : "bg-slate-50 text-text-muted hover:bg-slate-100"
      }`}
    >
      {completed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <span className="font-mono text-xs">{stepNumber}</span>
      )}
      <span className="truncate hidden sm:inline">{label}</span>
    </button>
  );
}
