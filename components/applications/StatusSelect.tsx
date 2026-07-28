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
  neutral: "border-border bg-slate-50 text-text-secondary",
  amber: "border-amber-300 bg-amber-50 text-warning font-bold",
  teal: "border-teal/40 bg-teal-light text-teal-dark font-bold",
  rose: "border-red-300 bg-red-50 text-danger font-bold",
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
      setStatus(initialStatus);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold font-mono uppercase text-text-secondary">
          Application Recruitment Status
        </label>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald">
            <Check className="h-3.5 w-3.5" /> Updated
          </span>
        )}
      </div>

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={status}
            onChange={handleChange}
            disabled={saving}
            className={`w-full appearance-none rounded-xl border px-4 py-2.5 pr-10 text-xs sm:text-sm uppercase tracking-wider transition-all ${toneClasses[currentTone]} disabled:opacity-60 cursor-pointer shadow-subtle`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
      </div>

      {/* Visual Workflow Dots Bar */}
      <div className="flex items-center gap-1.5 pt-1">
        {STATUSES.map((s, i) => (
          <div key={s.value} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-2 w-full rounded-full transition-all ${
                STATUSES.findIndex((x) => x.value === status) >= i
                  ? s.tone === "rose"
                    ? "bg-danger"
                    : s.tone === "teal"
                    ? "bg-teal"
                    : s.tone === "amber"
                    ? "bg-warning"
                    : "bg-primary"
                  : "bg-slate-200"
              }`}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
}
