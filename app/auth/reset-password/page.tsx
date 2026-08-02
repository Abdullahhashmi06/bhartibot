"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Shell from "@/components/layout/Shell";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  verifyRecaptcha,
  recaptchaErrorMessage,
} from "@/lib/recaptcha/client";

const inputClass =
  "w-full rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all shadow-subtle";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "success" | "error" | "expired">("loading");
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase client automatically picks up the recovery token from the URL hash
    // and exchanges it for a session via the onAuthStateChange listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
        setStatus("ready");
      } else if (event === "SIGNED_IN" && session) {
        setHasSession(true);
        setStatus("ready");
      }
    });

    // Fallback: check if there's already a session (user might have navigated here)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
        setStatus("ready");
      } else {
        // Give it a moment for the hash token to be processed
        setTimeout(() => {
          setStatus((prev) => (prev === "loading" ? "expired" : prev));
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const check = await verifyRecaptcha("password_reset");
    if (!check.ok) {
      setError(recaptchaErrorMessage());
      return;
    }

    setStatus("submitting");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  return (
    <Shell>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Loading State */}
          {status === "loading" && (
            <div className="rounded-2xl border border-border bg-white p-8 shadow-card text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-light flex items-center justify-center">
                <Lock className="h-6 w-6 text-teal animate-pulse" />
              </div>
              <h1 className="font-display font-bold text-xl text-primary">Verifying Reset Link</h1>
              <p className="text-sm text-text-secondary">Please wait while we verify your password reset link...</p>
              <div className="h-1.5 w-32 mx-auto bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary rounded-full animate-shimmer" style={{ width: "60%" }} />
              </div>
            </div>
          )}

          {/* Expired State */}
          {status === "expired" && (
            <div className="rounded-2xl border border-border bg-white p-8 shadow-card text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <h1 className="font-display font-bold text-xl text-primary">Link Expired or Invalid</h1>
              <p className="text-sm text-text-secondary">
                This password reset link has expired or is no longer valid. Please request a new one.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* Reset Form */}
          {(status === "ready" || status === "submitting" || status === "error") && (
            <div className="rounded-2xl border border-border bg-white p-8 shadow-card space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-light flex items-center justify-center">
                  <Lock className="h-6 w-6 text-teal" />
                </div>
                <h1 className="font-display font-bold text-2xl text-primary">Reset Your Password</h1>
                <p className="text-sm text-text-secondary">Enter a new password for your account.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass}
                      placeholder="Enter new password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={inputClass}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="rounded-2xl border border-border bg-white p-8 shadow-card text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-light flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald" />
              </div>
              <h1 className="font-display font-bold text-2xl text-primary">Password Updated!</h1>
              <p className="text-sm text-text-secondary">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <div className="pt-2">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-teal">
                  Continue to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
