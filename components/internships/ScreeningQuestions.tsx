"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";
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
  { value: "TEXT", label: "Free-Text Answer", hint: "Candidate writes open response" },
  { value: "YES_NO", label: "Yes / No Binary", hint: "Quick binary pre-screen" },
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
  const [type, setType] = useState<QuestionType>("TEXT");
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
          "Could not save the question."
      );
      return;
    }

    setQuestions((prev) => [...prev, question]);
    setText("");
    setType("TEXT");
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
    <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-emerald" />
          <h2 className="font-display font-bold text-lg text-primary">
            Screening Questions Builder
          </h2>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Candidates answer these custom questions on submission.
        </p>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      {questions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-text-muted">
          No screening questions configured yet. Add your first question below.
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-slate-50/50 p-4 shadow-subtle"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Q{index + 1}
                  </span>
                  <Tag tone={q.type === "YES_NO" ? "teal" : "neutral"}>
                    {q.type === "YES_NO" ? "Yes / No" : "Free-Text"}
                  </Tag>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-text-primary">
                  {q.question}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                disabled={status !== "idle"}
                aria-label={`Delete question ${index + 1}`}
                className="rounded-xl p-2 text-text-muted transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-50 shrink-0"
              >
                <Trash2
                  className={`h-4 w-4 ${
                    deletingId === q.id ? "animate-pulse text-danger" : ""
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* New Question Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-border bg-slate-50 p-5 space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary">New Screening Question</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Have you completed a course in financial accounting?"
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-text-primary focus:border-teal focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary">Answer Type</label>
          <div className="flex flex-wrap gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs transition-colors ${
                  type === opt.value
                    ? "border-teal bg-teal-light/50 text-teal-dark font-semibold shadow-subtle"
                    : "border-border bg-white text-text-primary hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="question_type"
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-semibold">{opt.label}</span>
                  <span className="block text-[10px] text-text-muted mt-0.5">
                    {opt.hint}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="sm"
          isLoading={status === "adding"}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Question
        </Button>
      </form>
    </div>
  );
}
