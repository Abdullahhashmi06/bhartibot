"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function sendLoginOtp(targetEmail: string): Promise<string | null> {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return otpError?.message ?? null;
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }

    setStatus("loading");
    const otpError = await sendLoginOtp(trimmed);
    setStatus("idle");

    if (otpError) {
      setError(
        otpError.toLowerCase().includes("signups not allowed") ||
          otpError.toLowerCase().includes("user not found")
          ? "No account found for this email. Sign up first."
          : otpError
      );
      return;
    }

    setStep("otp");
  }

  async function handleVerifyOtp(token: string): Promise<string | null> {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });

    if (verifyError) {
      return verifyError.message;
    }

    const next = searchParams.get("next") || "/dashboard";
    router.push(next);
    router.refresh();
    return null;
  }

  async function handleResendOtp(): Promise<string | null> {
    return sendLoginOtp(email.trim());
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
        <div>
          <Tag tone="teal">Email OTP sign-in</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            {step === "email" ? "Log in" : "Enter your code"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {step === "email"
              ? "We'll email you a one-time code — no password needed."
              : "Use the 6-digit code from your email to continue."}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            {error && <FormNotice tone="error">{error}</FormNotice>}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Email</span>
              <input
                type="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
              />
            </label>

            <Button type="submit" className="mt-2 w-full" disabled={status === "loading"}>
              {status === "loading" ? "Sending code…" : "Send login code"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <OtpVerifyForm
              email={email.trim()}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              verifyLabel="Log in"
              hint="We sent a 6-digit login code to"
            />
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="text-sm text-muted underline underline-offset-2 hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        )}

        <p className="text-sm text-muted">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </Shell>
  );
}
