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
            {isLogin ? "Sign in to manage your applications" : "Create an account to find internships"}
          </p>
        </div>

        {useOtp ? (
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
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseOtp(true)}
                  className="text-xs text-teal font-medium hover:underline"
                >
                  Login with verification code instead
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="text-teal font-medium hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <button
            onClick={() => (window.location.href = "/login")}
            className="text-xs text-text-secondary hover:text-primary transition-colors"
          >
            Recruiter? Sign in here →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
