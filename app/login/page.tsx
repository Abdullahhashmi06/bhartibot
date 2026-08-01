"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, HelpCircle, ArrowLeft } from "lucide-react";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
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
  const [showHelp, setShowHelp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

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
      setError("Enter your email address to continue.");
      return;
    }

    setStatus("loading");
    const otpError = await sendLoginOtp(trimmed);
    setStatus("idle");

    if (otpError) {
      console.error("Supabase OTP error:", otpError);
      setError(otpError);
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

  async function handleGoogleLogin() {
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setError(error.message);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address to reset your password.");
      return;
    }

    setStatus("loading");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setStatus("idle");

    if (resetError) {
      setError(resetError.message);
    } else {
      setError("Password reset link sent! Check your email.");
      // Optional: you could use a success state or toast here if available.
    }
  }

  return (
    <Shell>
      <div className="mx-auto flex min-h-[calc(100vh-160px)] items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
          {/* Brand Card Top Banner */}
          <div className="bg-primary p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial-ai opacity-30 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="font-display font-extrabold text-2xl tracking-tight">
                InternIQ Workspace
              </h1>
              <p className="font-mono text-xs text-teal">
                Discover Potential. Create Impact.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-primary">
                {isForgotPassword 
                  ? "Reset Password" 
                  : step === "email" 
                    ? "Recruiter Sign In" 
                    : "Verify Authentication Code"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                {isForgotPassword
                  ? "Enter your email to receive a password reset link."
                  : step === "email"
                    ? "Enter your work email to receive a secure one-time passcode."
                    : "We sent a 6-digit passcode to your email inbox."}
              </p>
            </div>

            {/* GOOGLE SIGN-IN PLACEHOLDER BUTTON */}
            {step === "email" && !isForgotPassword && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-slate-50 py-2.5 px-4 text-xs sm:text-sm font-semibold text-text-primary hover:bg-slate-100 transition-colors shadow-subtle"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-border" />
                  <span className="bg-white px-3 font-mono text-[10px] uppercase text-text-muted">
                    or email login
                  </span>
                </div>
              </div>
            )}

            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && <FormNotice tone={error.includes("sent") ? "success" : "error"}>{error}</FormNotice>}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                    <span>Work Email Address</span>
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                  </label>
                  <input
                    type="email"
                    placeholder="recruiter@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full py-3"
                  isLoading={status === "loading"}
                >
                  Send Reset Link
                </Button>
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError(null);
                    }}
                    className="text-xs text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </button>
                </div>
              </form>
            ) : step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                {error && <FormNotice tone="error">{error}</FormNotice>}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                    <span>Work Email Address</span>
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                  </label>
                  <input
                    type="email"
                    placeholder="recruiter@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full py-3"
                  isLoading={status === "loading"}
                >
                  Send One-Time Passcode
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="text-xs text-teal font-medium hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <OtpVerifyForm
                  email={email.trim()}
                  onVerify={handleVerifyOtp}
                  onResend={handleResendOtp}
                  verifyLabel="Authenticate & Log In"
                  hint="We sent your 6-digit login code to"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Use a different email address
                </button>
              </div>
            )}

            {/* FORGOT SIGN-IN HELP SECTION PLACEHOLDER */}
            <div className="border-t border-border pt-4 text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-teal transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Need sign-in assistance?</span>
              </button>

              {showHelp && (
                <div className="rounded-xl border border-border bg-slate-50 p-3 text-left text-xs text-text-secondary space-y-1">
                  <p className="font-semibold text-text-primary">Recruiter Access Tips:</p>
                  <p>• Make sure to check your spam/junk folder for the OTP code.</p>
                  <p>• If you don&apos;t have an account, sign up first.</p>
                </div>
              )}

              <p className="text-xs text-text-secondary pt-1">
                No recruiter workspace yet?{" "}
                <Link href="/signup" className="font-bold text-teal-dark hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="text-xs text-text-secondary pt-1">
                Looking for internships instead?{" "}
                <Link href="/applicant-auth" className="font-bold text-purple-ai hover:underline">
                  Applicant Portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
