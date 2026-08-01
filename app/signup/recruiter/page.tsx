"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, User, Building, Mail, Lock, ArrowLeft } from "lucide-react";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import OtpVerifyForm from "@/components/auth/OtpVerifyForm";
import { createClient } from "@/lib/supabase/client";

type Step = "details" | "otp";

export default function RecruiterSignupPage() {
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
      setError("Password must be at least 8 characters long.");
      return;
    }

    setStatus("loading");

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

    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError("An account with this email already exists. Log in instead.");
      return;
    }

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
      <div className="mx-auto flex min-h-[calc(100vh-160px)] items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
          {/* Brand Banner Header */}
          <div className="bg-primary p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial-ai opacity-30 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <Link
                href="/signup"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="font-display font-extrabold text-2xl tracking-tight">
                Recruiter Workspace
              </h1>
              <p className="font-mono text-xs text-teal">
                Post internships · Screen with AI · Hire smarter
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-primary">
                {step === "details" ? "Create Your Account" : "Verify Email Address"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                {step === "details"
                  ? "Set up your recruiter workspace in seconds."
                  : "Enter the code we sent to your email inbox to activate."}
              </p>
            </div>

            {step === "details" ? (
              <form onSubmit={handleSignup} className="space-y-4">
                {error && <FormNotice tone="error">{error}</FormNotice>}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                    <span>Full Name</span>
                    <User className="h-3.5 w-3.5 text-text-muted" />
                  </label>
                  <input
                    type="text"
                    placeholder="Abdullah Khan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                    <span>Organization Name</span>
                    <Building className="h-3.5 w-3.5 text-text-muted" />
                  </label>
                  <input
                    type="text"
                    placeholder="ABC Technologies"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                    <span>Work Email</span>
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                  </label>
                  <input
                    type="email"
                    placeholder="you@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                    <span>Password</span>
                    <Lock className="h-3.5 w-3.5 text-text-muted" />
                  </label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full py-3 mt-2"
                  isLoading={status === "loading"}
                >
                  Create Recruiter Workspace
                </Button>
              </form>
            ) : (
              <OtpVerifyForm
                email={email.trim()}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                verifyLabel="Verify & Create Workspace"
                hint="We sent a 6-digit verification code to"
              />
            )}

            <div className="border-t border-border pt-4 text-center space-y-2">
              <p className="text-xs text-text-secondary">
                Already have a workspace?{" "}
                <Link href="/login" className="font-bold text-teal-dark hover:underline">
                  Log in
                </Link>
              </p>
              <div className="rounded-xl bg-purple-light/50 border border-purple-ai/20 p-3 text-center">
                <p className="text-xs text-purple-ai font-medium">
                  🎓 Looking for internships instead?{" "}
                  <Link href="/applicant-auth" className="font-bold text-purple-ai hover:underline">
                    Sign up as an Applicant
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
