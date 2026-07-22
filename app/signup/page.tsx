"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import { createClient } from "@/lib/supabase/client";

type Step = "details" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");

    // full_name and organization_name ride along as user metadata.
    // Partner's DB trigger (on auth.users insert) creates org + profile.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization_name: orgName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus("idle");

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Existing account — Supabase may return an empty identities list.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError("An account with this email already exists. Log in instead.");
      return;
    }

    // Confirm-email disabled in Supabase → session returned immediately.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setStep("otp");
  }

  async function handleVerifyOtp(token: string): Promise<string | null> {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "signup",
    });

    if (verifyError) {
      return verifyError.message;
    }

    router.push("/dashboard");
    router.refresh();
    return null;
  }

  async function handleResendOtp(): Promise<string | null> {
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return resendError?.message ?? null;
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
        <div>
          <Tag tone="teal">Email OTP verification</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            {step === "details" ? "Create a recruiter account" : "Verify your email"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {step === "details"
              ? "One account per organization to start."
              : "Enter the code we emailed you to finish creating your account."}
          </p>
        </div>

        {step === "details" ? (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && <FormNotice tone="error">{error}</FormNotice>}

            <Field
              label="Full name"
              type="text"
              placeholder="Abdullah Khan"
              value={fullName}
              onChange={setFullName}
              required
            />
            <Field
              label="Organization name"
              type="text"
              placeholder="ABC Technologies"
              value={orgName}
              onChange={setOrgName}
              required
            />
            <Field
              label="Email"
              type="email"
              placeholder="you@organization.com"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              required
            />

            <Button type="submit" className="mt-2 w-full" disabled={status === "loading"}>
              {status === "loading" ? "Sending code…" : "Create account"}
            </Button>
          </form>
        ) : (
          <OtpVerifyForm
            email={email.trim()}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            verifyLabel="Verify & continue"
            hint="We sent a 6-digit verification code to"
          />
        )}

        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </Shell>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={type === "password" ? 8 : undefined}
        className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
      />
    </label>
  );
}
