"use client";

import { X, Plus } from "lucide-react";

export default function RequirementList({
  label,
  tone,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  tone: "amber" | "teal";
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const dotColor = tone === "amber" ? "bg-amber" : "bg-teal";

  function update(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium text-text">{label}</span>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Remove ${label.toLowerCase()} item`}
            className="rounded-md p-2 text-muted hover:bg-ink/5 hover:text-rose"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:border-ink hover:text-ink"
      >
        <Plus size={14} />
        Add {label.toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}
