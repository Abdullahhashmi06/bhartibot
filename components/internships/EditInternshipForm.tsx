"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import { createClient } from "@/lib/supabase/client";
import { updateInternship } from "@/lib/queries/internships";
import { Internship, Requirement, RequirementType } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink focus:outline-none";

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
  const [requirements, setRequirements] =
    useState<Requirement[]>(initialRequirements);

  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    setStatus("saving");

    const { error: updateError } = await updateInternship(
      supabase,
      internship.id,
      {
        title: title.trim(),
        description: description.trim(),
        requirements,
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

  const required = requirements.filter((r) => r.type === "required");
  const preferred = requirements.filter((r) => r.type === "preferred");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <FormNotice tone="error">{error}</FormNotice>}
      {success && (
        <FormNotice tone="success">Internship updated successfully.</FormNotice>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">
          Title <span className="text-rose">*</span>
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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className={inputClass}
          placeholder="Describe the role, responsibilities, and what the intern will learn…"
        />
      </div>

      {/* Requirements */}
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-base font-medium text-ink">
          Requirements
        </h2>

        {/* Required */}
        <div>
          <p className="text-sm font-medium text-text mb-2">Required</p>
          <div className="flex flex-col gap-2">
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
                    className="text-muted hover:text-rose transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : null
            )}
          </div>
          <button
            type="button"
            onClick={() => addRequirement("required")}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
          >
            <PlusCircle size={14} />
            Add required
          </button>
        </div>

        {/* Preferred */}
        <div>
          <p className="text-sm font-medium text-text mb-2">Preferred</p>
          <div className="flex flex-col gap-2">
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
                    className="text-muted hover:text-rose transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : null
            )}
          </div>
          <button
            type="button"
            onClick={() => addRequirement("preferred")}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
          >
            <PlusCircle size={14} />
            Add preferred
          </button>
        </div>
      </div>

      <Button type="submit" disabled={status === "saving"} className="mt-2 w-fit">
        {status === "saving" ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
