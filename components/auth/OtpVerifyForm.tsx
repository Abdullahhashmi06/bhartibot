"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";

export default function OtpVerifyForm({
  email,
  onVerify,
  onResend,
  verifyLabel = "Verify code",
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
      setError("Enter the 6-digit code from your email.");
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

    setInfo("A new code was sent. Check your inbox.");
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      {error && <FormNotice tone="error">{error}</FormNotice>}
      {info && <FormNotice tone="info">{info}</FormNotice>}

      <p className="text-sm text-muted">
        {hint ?? "We sent a 6-digit code to"}{" "}
        <span className="font-medium text-ink">{email}</span>.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Verification code</span>
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
          className="rounded-md border border-border bg-white px-3 py-2 font-mono text-lg tracking-[0.3em] text-text placeholder:text-muted/70 focus:border-ink"
        />
      </label>

      <Button type="submit" className="w-full" disabled={status !== "idle"}>
        {status === "verifying" ? "Verifying…" : verifyLabel}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={status !== "idle"}
        className="text-sm text-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
      >
        {status === "resending" ? "Sending…" : "Resend code"}
      </button>
    </form>
  );
}
