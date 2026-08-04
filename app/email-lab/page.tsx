"use client";

import { useState } from "react";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import {
  KeyRound,
  Lock,
  CheckCircle2,
  XCircle,
  Video,
  Bell,
  Mail,
  Sparkles,
} from "lucide-react";

type Template = "otp" | "reset" | "shortlisted" | "rejected" | "interview" | "reminder";

const TEMPLATES: { value: Template; label: string; icon: typeof Mail }[] = [
  { value: "otp", label: "OTP Email", icon: KeyRound },
  { value: "reset", label: "Password Reset", icon: Lock },
  { value: "shortlisted", label: "Shortlisted", icon: CheckCircle2 },
  { value: "rejected", label: "Rejected", icon: XCircle },
  { value: "interview", label: "Interview Invitation", icon: Video },
  { value: "reminder", label: "Interview Reminder", icon: Bell },
];

export default function EmailLabPage() {
  const [to, setTo] = useState("");
  const [template, setTemplate] = useState<Template>("otp");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSend() {
    if (!to.trim()) {
      setStatus("error");
      setMessage("Enter a recipient email address.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/email/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), template }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || `Request failed (${res.status}).`);
        return;
      }
      if (data.skipped) {
        setStatus("error");
        setMessage(data.error || "SMTP not configured.");
        return;
      }
      setStatus("done");
      setMessage(`Email sent to ${to.trim()} (${template}) — messageId ${data.messageId || "n/a"}.`);
    } catch {
      setStatus("error");
      setMessage("Network error while sending the email.");
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-teal">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary tracking-tight">
              Email Lab
            </h1>
            <p className="text-sm text-text-secondary">
              Developer-only preview of the InternIQ email templates. Sends a
              real email to any address.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
              <span>Recipient Email</span>
              <Mail className="h-3.5 w-3.5 text-text-muted" />
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-text-primary">Email Template</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const active = template === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTemplate(t.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      active
                        ? "border-teal bg-teal-light text-teal-dark shadow-subtle"
                        : "border-border bg-slate-50 text-text-secondary hover:border-teal/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSend}
            variant="gradient"
            className="w-full py-3"
            isLoading={status === "sending"}
          >
            Send Test Email
          </Button>

          {status === "done" && (
            <div className="rounded-xl border border-emerald/30 bg-emerald-light p-3 text-xs font-semibold text-emerald-dark">
              ✅ {message}
            </div>
          )}
          {status === "error" && (
            <div className="rounded-xl border border-danger/30 bg-red-50 p-3 text-xs font-semibold text-danger">
              ⚠️ {message}
            </div>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-text-muted">
          Disabled in production unless EMAIL_TEST_SECRET is configured.
        </p>
      </div>
    </Shell>
  );
}
