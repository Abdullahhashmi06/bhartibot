"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Save, FileText, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import { createClient } from "@/lib/supabase/client";
import { updateInternship } from "@/lib/queries/internships";
import { Internship, Requirement, RequirementType } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-border bg-slate-50/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all";

export default function EditInternshipForm({
  internship,
  initialRequirements,
}: {
  internship: Internship;
  initialRequirements: Requirement[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(internship.title);
  const [description, setDescription] = useState(internship.description ?? "");
  const [githubRequired, setGithubRequired] = useState(
    internship.github_required ?? false
  );
  const [linkedinRequired, setLinkedinRequired] = useState(
    internship.linkedin_required ?? false
  );
  const [requirements, setRequirements] =
    useState<Requirement[]>(initialRequirements);

  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /** Today's date as YYYY-MM-DD in local time. */
  const todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  /** The originally-stored deadline (YYYY-MM-DD) — may be historical (past). */
  const originalDeadline = internship.deadline
    ? internship.deadline.slice(0, 10)
    : "";
  /** Allow keeping an existing historical deadline, but never a new past date. */
  const deadlineMin = originalDeadline && originalDeadline < todayIso ? originalDeadline : todayIso;

  function addRequirement(type: RequirementType) {
    setRequirements((prev) => [...prev, { requirement: "", type }]);
  }

  function updateRequirement(index: number, value: string) {
    setRequirements((prev) =>
      prev.map((r, i) => (i === index ? { ...r, requirement: value } : r))
    );
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    // Deadline validation — prevent NEW past deadlines, but allow keeping the
    // existing historical value when editing legacy data.
    if (deadline && deadline < todayIso && deadline !== originalDeadline) {
      setError("The application deadline cannot be in the past.");
      return;
    }

    setStatus("saving");

    const { error: updateError } = await updateInternship(
      supabase,
      internship.id,
      {
        title: title.trim(),
        description: description.trim(),
        requirements,
        github_required: githubRequired,
        linkedin_required: linkedinRequired,
      }
    );

    setStatus("idle");

    if (updateError) {
      setError(updateError);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal" />
          <h2 className="font-display font-bold text-lg text-primary">
            Edit Role Parameters & Requirements
          </h2>
        </div>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}
      {success && (
        <FormNotice tone="success">Internship requirements updated successfully.</FormNotice>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-primary">
          Role Title <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="e.g. Machine Learning Intern"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-primary">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputClass}
          placeholder="Describe the role, responsibilities, and what the intern will learn…"
        />
      </div>

<<<<<<< Updated upstream
=======
      {/* Listing metadata: stipend, deadline, type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary">Stipend (if any)</label>
          <input
            type="text"
            value={stipend}
            onChange={(e) => setStipend(e.target.value)}
            className={inputClass}
            placeholder="e.g. PKR 25,000/month"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary">Application Deadline</label>
          <input
            type="date"
            value={deadline}
            min={deadlineMin}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
          {originalDeadline && originalDeadline < todayIso && (
            <p className="text-[11px] text-text-muted">
              This internship already passed its deadline (historical data) — you
              can keep it, but new dates cannot be in the past.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary">Internship Type</label>
          <select
            value={internshipType}
            onChange={(e) => setInternshipType(e.target.value)}
            className={inputClass}
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

>>>>>>> Stashed changes
      {/* GitHub & LinkedIn Required Toggles */}
      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Required Profile Links from Applicants</p>
        <p className="text-xs text-text-secondary">If marked compulsory, applicants must provide the link or enter <span className="font-mono font-bold text-teal-dark">N/A</span> if they don&apos;t have one.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGithubRequired(!githubRequired)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
              githubRequired
                ? "border-teal bg-teal-light text-teal-dark shadow-subtle"
                : "border-border bg-slate-50 text-text-secondary hover:border-slate-300 dark:bg-slate-800 dark:hover:border-slate-600"
            }`}
          >
            <Github className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">GitHub Link</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              githubRequired ? "bg-teal/20 text-teal-dark" : "bg-slate-200 text-text-muted dark:bg-slate-700"
            }`}>
              {githubRequired ? "Compulsory" : "Optional"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLinkedinRequired(!linkedinRequired)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
              linkedinRequired
                ? "border-purple-ai bg-purple-light text-purple-ai shadow-subtle"
                : "border-border bg-slate-50 text-text-secondary hover:border-slate-300 dark:bg-slate-800 dark:hover:border-slate-600"
            }`}
          >
            <Linkedin className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">LinkedIn Link</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              linkedinRequired ? "bg-purple-ai/20 text-purple-ai" : "bg-slate-200 text-text-muted dark:bg-slate-700"
            }`}>
              {linkedinRequired ? "Compulsory" : "Optional"}
            </span>
          </button>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-display font-bold text-base text-primary">
          Requirements Mapping
        </h3>

        {/* Required */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-mono uppercase text-warning">
            Required Qualifications
          </label>
          <div className="space-y-2">
            {requirements.map((req, idx) =>
              req.type === "required" ? (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={req.requirement}
                    onChange={(e) => updateRequirement(idx, e.target.value)}
                    placeholder="e.g. Python"
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(idx)}
                    className="text-text-muted hover:text-danger transition-colors p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null
            )}
          </div>
          <button
            type="button"
            onClick={() => addRequirement("required")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-dark hover:underline pt-1"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add required qualification
          </button>
        </div>

        {/* Preferred */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold font-mono uppercase text-teal">
            Preferred / Bonus Skills
          </label>
          <div className="space-y-2">
            {requirements.map((req, idx) =>
              req.type === "preferred" ? (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={req.requirement}
                    onChange={(e) => updateRequirement(idx, e.target.value)}
                    placeholder="e.g. TensorFlow"
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(idx)}
                    className="text-text-muted hover:text-danger transition-colors p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null
            )}
          </div>
          <button
            type="button"
            onClick={() => addRequirement("preferred")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-dark hover:underline pt-1"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add preferred qualification
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <Button
          type="submit"
          variant="gradient"
          isLoading={status === "saving"}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save Role Changes
        </Button>
      </div>
    </form>
  );
}
