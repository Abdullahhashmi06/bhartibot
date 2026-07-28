"use client";

import { FormEvent, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";

export default function OtpVerifyForm({
  email,
  onVerify,
  onResend,
  verifyLabel = "Verify Passcode",
  hint,
}: {
  email: string;
  onVerify: (otp: string) => Promise<string | null>;
  onResend: () => Promise<string | null>;
  verifyLabel?: string;
  hint?: string;
}) {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "resending">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const code = otp.replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the complete 6-digit passcode from your email.");
      return;
    }

    setStatus("verifying");
    const verifyError = await onVerify(code);
    setStatus("idle");

    if (verifyError) {
      setError(verifyError);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setStatus("resending");
    const resendError = await onResend();
    setStatus("idle");

    if (resendError) {
      setError(resendError);
      return;
    }

    setInfo("A new 6-digit passcode has been sent to your inbox.");
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {error && <FormNotice tone="error">{error}</FormNotice>}
      {info && <FormNotice tone="info">{info}</FormNotice>}

      <div className="rounded-xl border border-border bg-slate-50 p-3.5 text-xs text-text-secondary leading-relaxed">
        {hint ?? "We sent a 6-digit verification code to"}{" "}
        <span className="font-semibold text-primary">{email}</span>.
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
          <span>Enter 6-Digit Passcode</span>
          <KeyRound className="h-3.5 w-3.5 text-text-muted" />
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          required
          className="w-full text-center rounded-xl border border-border bg-slate-50/50 py-3 font-mono text-2xl font-bold tracking-[0.4em] text-primary placeholder:text-text-muted/40 focus:border-teal focus:bg-white focus:outline-none transition-all"
        />
      </div>

      <Button
        type="submit"
        variant="gradient"
        className="w-full py-3"
        isLoading={status === "verifying"}
      >
        {verifyLabel}
      </Button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={handleResend}
          disabled={status !== "idle"}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-teal transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status === "resending" ? "animate-spin text-teal" : ""}`} />
          <span>{status === "resending" ? "Sending..." : "Resend new passcode"}</span>
        </button>
      </div>
    </form>
  );
}
