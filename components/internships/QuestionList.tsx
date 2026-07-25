"use client";

import { QuestionType } from "@/lib/types";

interface Question {
  question: string;
  type: QuestionType;
}

export default function QuestionList({
  items,
  onChange,
}: {
  items: Question[];
  onChange: (items: Question[]) => void;
}) {
  function updateQuestion(index: number, value: string) {
    const next = [...items];
    next[index].question = value;
    onChange(next);
  }

  function updateType(index: number, value: QuestionType) {
    const next = [...items];
    next[index].type = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...items,
      {
        question: "",
        type: "text",
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-text">Screening Questions</h3>

        <button
          type="button"
          onClick={add}
          className="rounded-md border border-border px-3 py-1 text-sm"
        >
          + Add Question
        </button>
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-md border border-border p-3 flex flex-col gap-2"
        >
          <input
            type="text"
            value={item.question}
            onChange={(e) => updateQuestion(index, e.target.value)}
            placeholder="Enter screening question"
            className="rounded-md border border-border px-3 py-2"
          />

          <select
            value={item.type}
            onChange={(e) =>
              updateType(index, e.target.value as QuestionType)
            }
            className="rounded-md border border-border px-3 py-2"
          >
            <option value="text">Text Answer</option>
            <option value="yes_no">Yes / No</option>
          </select>

          {items.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-sm text-red-500 self-start"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}