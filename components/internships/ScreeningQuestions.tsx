"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import { createClient } from "@/lib/supabase/client";
import {
  createQuestion,
  deleteQuestion,
} from "@/lib/queries/questions";
import { QuestionType, ScreeningQuestion } from "@/lib/types";

const TYPE_OPTIONS: { value: QuestionType; label: string; hint: string }[] = [
  { value: "text", label: "Text", hint: "Free-text answer" },
  { value: "yes_no", label: "Yes / No", hint: "Binary choice" },
];

export default function ScreeningQuestions({
  internshipId,
  initialQuestions,
}: {
  internshipId: string;
  initialQuestions: ScreeningQuestion[];
}) {
  const supabase = createClient();
  const [questions, setQuestions] =
    useState<ScreeningQuestion[]>(initialQuestions);
  const [text, setText] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [status, setStatus] = useState<"idle" | "adding" | "deleting">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Enter a question before adding.");
      return;
    }

    setStatus("adding");
    const { question, error: createError } = await createQuestion(
      supabase,
      internshipId,
      text,
      type
    );
    setStatus("idle");

    if (createError || !question) {
      setError(
        createError ??
          "Could not save the question. Confirm the questions table and RLS policies are set up (Developer B)."
      );
      return;
    }

    setQuestions((prev) => [...prev, question]);
    setText("");
    setType("text");
  }

  async function handleDelete(questionId: string) {
    setError(null);
    setStatus("deleting");
    setDeletingId(questionId);

    const { error: deleteError } = await deleteQuestion(supabase, questionId);

    setStatus("idle");
    setDeletingId(null);

    if (deleteError) {
      setError(deleteError);
      return;
    }

    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <div>
        <h2 className="font-display text-lg font-medium text-ink">
          Screening Questions
        </h2>
        <p className="mt-1 text-sm text-muted">
          Applicants will answer these when they apply. Use Text for open
          answers, or Yes / No for a quick screen.
        </p>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      {questions.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          No screening questions yet. Add one below.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    Q{index + 1}
                  </span>
                  <Tag tone={q.type === "yes_no" ? "teal" : "neutral"}>
                    {q.type === "yes_no" ? "Yes / No" : "Text"}
                  </Tag>
                </div>
                <p className="mt-2 text-sm text-text">{q.question}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                disabled={status !== "idle"}
                aria-label={`Delete question ${index + 1}`}
                className="shrink-0 rounded-md p-2 text-muted transition-colors hover:bg-ink/5 hover:text-rose disabled:opacity-50"
              >
                <Trash2
                  size={16}
                  className={
                    deletingId === q.id ? "animate-pulse text-rose" : undefined
                  }
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-4 rounded-md border border-border bg-white p-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">New question</span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Have you completed a course in financial accounting?"
            className="w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-text">Answer type</legend>
          <div className="flex flex-wrap gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  type === opt.value
                    ? "border-ink bg-ink/5 text-ink"
                    : "border-border text-text hover:border-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="question_type"
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {opt.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="secondary"
          disabled={status === "adding"}
          className="w-fit"
        >
          <Plus size={14} />
          {status === "adding" ? "Adding…" : "Add question"}
        </Button>
      </form>
    </section>
  );
}
