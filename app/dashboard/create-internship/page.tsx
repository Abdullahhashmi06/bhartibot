"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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

  const [title, setTitle] = useState("");
  const [field, setField] = useState(FIELD_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("on-site");
  const [duration, setDuration] = useState("");
  const [required, setRequired] = useState<string[]>([""]);
  const [preferred, setPreferred] = useState<string[]>([""]);
  const [questions, setQuestions] = useState<
    {
      question: string;
      type: QuestionType;
    }[]
  >([
    {
      question: "",
      type: "text",
    },
  ]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !location.trim() || !duration.trim()) {
      setError("Title, location, and duration are required.");
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
      <div className="mx-auto flex max-w-xl flex-col gap-6 py-10">
        <div>
          <Tag tone="teal">Wired to Supabase</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            Create Internship
          </h1>
          <p className="mt-1 text-sm text-muted">
            Define the role and what evidence you&apos;re looking for.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <FormNotice tone="error">{error}</FormNotice>}

          <Field label="Internship Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Machine Learning Intern"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
            />
          </Field>

          <Field label="Field">
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:border-ink"
            >
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What will the intern actually work on?"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
            />
          </Field>

          <Field label="Location" required>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Islamabad"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
            />
          </Field>

          <Field label="Work Mode">
            <div className="flex gap-4">
              {WORK_MODES.map((mode) => (
                <label
                  key={mode.value}
                  className="flex items-center gap-2 text-sm text-text"
                >
                  <input
                    type="radio"
                    name="work_mode"
                    checked={workMode === mode.value}
                    onChange={() => setWorkMode(mode.value)}
                  />
                  {mode.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Duration" required>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="8 weeks"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
            />
          </Field>

          <div className="flex flex-col gap-4 border-t border-border pt-5">
            <RequirementList
              label="Required"
              tone="amber"
              items={required}
              onChange={setRequired}
              placeholder="Python"
            />
            <RequirementList
              label="Preferred"
              tone="teal"
              items={preferred}
              onChange={setPreferred}
              placeholder="Pandas"
            />
          </div>
          <QuestionList
        items={questions}
            onChange={setQuestions}
          />

          <Button type="submit" disabled={status === "loading"} className="mt-2">
            {status === "loading" ? "Creating…" : "Create Internship"}
          </Button>
        </form>
      </div>
    </Shell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">
        {label}
        {required && <span className="text-rose"> *</span>}
      </span>
      {children}
    </label>
  );
}
