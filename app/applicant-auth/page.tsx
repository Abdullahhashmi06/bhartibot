"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, User, KeyRound, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ApplicantAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const ensureProfile = async (userId: string, userEmail: string | undefined, name?: string) => {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from("applicant_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existing) {
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase.from("applicant_profiles").insert({
        id: userId,
        email: userEmail,
        full_name: fullName || name || "",
        role: "applicant",
      });

      if (insertError) {
        console.error("[ApplicantAuth] Profile insert failed:", insertError.message);
        // Try once more with a small delay (maybe RLS propagation delay)
        await new Promise((r) => setTimeout(r, 500));
        const { error: retryError } = await supabase.from("applicant_profiles").insert({
          id: userId,
          email: userEmail,
          full_name: fullName || name || "",
          role: "applicant",
        });
        if (retryError) {
          console.error("[ApplicantAuth] Retry also failed:", retryError.message);
          return false;
        }
      }
    }
    return true;
  };

  const redirectToApplicant = () => {
    // Use location.replace to avoid back-button issues and let middleware re-check session
    window.location.replace("/applicant");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/applicant-callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email!");
      setIsForgotPassword(false);
    }
  };

  const handleOtpRequest = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpStep(true);
    toast.success("Verification code sent to your email");
  };

  const handleOtpVerify = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      toast.error("Please enter the complete verification code");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode,
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Ensure profile exists
    if (data.user) {
      await ensureProfile(data.user.id, data.user.email);
    }
    toast.success("Welcome back!");
    setTimeout(() => redirectToApplicant(), 300);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Password login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          // If password login fails, try signInWithOtp as fallback
          if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
            toast.error("Check your email for a verification link, or try the 'Login with Code' option");
            setLoading(false);
            return;
          }
          throw error;
        }

        if (data.user) {
          const profileOk = await ensureProfile(data.user.id, data.user.email);
          if (!profileOk) {
            console.warn("[ApplicantAuth] Profile creation failed on login, but proceeding");
          }
        }

        toast.success("Welcome back!");
        setTimeout(() => redirectToApplicant(), 300);
      } else {
        // Password signup
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName, role: "applicant" },
          },
        });
        if (error) throw error;

        if (data.user) {
          const profileOk = await ensureProfile(data.user.id, data.user.email, fullName);
          if (!profileOk) {
            toast.error("Account created but profile setup failed. Please try signing in.");
            setIsLogin(true);
            setLoading(false);
            return;
          }
        }

        if (data.session) {
          toast.success("Account created successfully!");
          setTimeout(() => redirectToApplicant(), 300);
        } else {
          toast.success("Check your email for a confirmation link. You can sign in after confirming.");
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication");
      console.error("[ApplicantAuth] Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset OTP state when toggling login/signup
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setOtpStep(false);
    setUseOtp(false);
    setIsForgotPassword(false);
    setOtpCode("");
  };

  // If in OTP verify step, show the OTP form
  if (otpStep) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-card border border-border"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-teal mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-display font-bold text-primary">Verify Code</h1>
            <p className="text-text-secondary text-sm mt-1 text-center">
              Enter the verification code sent to<br />
              <span className="font-semibold text-primary">{email}</span>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleOtpVerify();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">6-Digit Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all text-center text-2xl font-mono tracking-[0.3em]"
                  placeholder="000000"
                />
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full mt-4" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setOtpStep(false);
                handleOtpRequest();
              }}
              className="text-sm text-teal font-medium hover:underline"
            >
              Resend code
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setOtpStep(false);
                setUseOtp(false);
              }}
              className="text-xs text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-card border border-border"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-teal mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary">InternIQ Portal</h1>
          <p className="text-text-secondary text-sm mt-1">
            {isForgotPassword 
              ? "Reset your password"
              : isLogin 
                ? "Sign in to manage your applications" 
                : "Create an account to find internships"}
          </p>
        </div>

        {!useOtp && !isForgotPassword && (
          <div className="mb-6 space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-text-primary hover:bg-slate-50 hover:shadow-subtle transition-all disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-text-muted font-medium">or continue with email</span>
              </div>
            </div>
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-xs text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </button>
            </div>
          </form>
        ) : useOtp ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <Button
              onClick={handleOtpRequest}
              variant="gradient"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
            <div className="text-center">
              <button
                onClick={() => setUseOtp(false)}
                className="text-xs text-text-secondary hover:text-primary transition-colors"
              >
                Use password instead
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full mt-6" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>

            {isLogin && (
              <div className="flex flex-col gap-3 mt-4">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-text-secondary hover:text-primary font-medium hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setUseOtp(true)}
                    className="text-xs text-teal font-medium hover:underline"
                  >
                    Login with verification code instead
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary dark:text-slate-300">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="text-teal dark:text-teal-300 font-medium hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border dark:border-slate-800 text-center">
          <button
            onClick={() => (window.location.href = "/login")}
            className="text-xs text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
          >
            Recruiter? Sign in here →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
