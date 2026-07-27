"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateApplicationStatus } from "@/lib/queries/applications";
import { ApplicationStatus } from "@/lib/types";

const STATUSES: { value: ApplicationStatus; label: string; tone: string }[] = [
  { value: "new", label: "New", tone: "neutral" },
  { value: "under_review", label: "Under Review", tone: "amber" },
  { value: "shortlisted", label: "Shortlisted", tone: "teal" },
  { value: "rejected", label: "Rejected", tone: "rose" },
];

const toneClasses: Record<string, string> = {
  neutral: "border-border bg-white text-muted",
  amber: "border-amber/40 bg-amber/10 text-[#8A5A16]",
  teal: "border-teal/40 bg-teal/10 text-[#1D6E63]",
  rose: "border-rose/40 bg-rose/10 text-[#8A3A20]",
};

export default function StatusSelect({
  applicationId,
  initialStatus,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus | string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<ApplicationStatus | string>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTone =
    STATUSES.find((s) => s.value === status)?.tone ?? "neutral";

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ApplicationStatus;
    setStatus(next);
    setSaved(false);
    setError(null);
    setSaving(true);

    const { error: updateError } = await updateApplicationStatus(
      supabase,
      applicationId,
      next
    );

    setSaving(false);

    if (updateError) {
      setError(updateError);
      setStatus(initialStatus); // revert
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">Application Status</label>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={status}
            onChange={handleChange}
            disabled={saving}
            className={`w-full appearance-none rounded-md border px-3 py-2 pr-8 font-mono text-[11px] uppercase tracking-wider transition-colors ${toneClasses[currentTone]} disabled:opacity-60 cursor-pointer`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
        <div className="flex h-8 w-8 items-center justify-center">
          {saving && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-ink" />
          )}
          {saved && !saving && (
            <Check size={16} className="text-teal" />
          )}
        </div>
      </div>

      {/* Visual workflow */}
      <div className="mt-2 flex items-center gap-1">
        {STATUSES.map((s, i) => (
          <div key={s.value} className="flex items-center gap-1">
            <div
              className={`h-1.5 w-6 rounded-full transition-colors ${
                STATUSES.findIndex((x) => x.value === status) >= i
                  ? s.tone === "rose"
                    ? "bg-rose"
                    : s.tone === "teal"
                    ? "bg-teal"
                    : s.tone === "amber"
                    ? "bg-amber"
                    : "bg-ink"
                  : "bg-border"
              }`}
            />
          </div>
        ))}
        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted">
          {STATUSES.find((s) => s.value === status)?.label ?? status}
        </span>
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose">{error}</p>
      )}
    </div>
  );
}
