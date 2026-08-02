"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Briefcase, GraduationCap, ArrowRight, ArrowLeft } from "lucide-react";
import Shell from "@/components/layout/Shell";

export default function SignupRolePage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<"recruiter" | "applicant" | null>(null);

  return (
    <Shell>
      <div className="mx-auto flex min-h-[calc(100vh-160px)] items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10 space-y-3">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-teal">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
              Join InternIQ
            </h1>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              Tell us who you are so we can set up the right experience for you.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recruiter Card */}
            <button
              onClick={() => router.push("/signup/recruiter")}
              onMouseEnter={() => setHovered("recruiter")}
              onMouseLeave={() => setHovered(null)}
              className={`group relative flex flex-col items-center gap-4 rounded-3xl border-2 p-8 text-center transition-all duration-200 cursor-pointer ${
                hovered === "recruiter"
                  ? "border-teal bg-teal-light dark:bg-teal-950/60 shadow-hover scale-[1.02]"
                  : "border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:border-teal hover:shadow-hover"
              }`}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                hovered === "recruiter" 
                  ? "bg-teal text-white shadow-teal" 
                  : "bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 text-teal dark:text-teal-400"
              }`}>
                <Briefcase className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className={`font-display font-extrabold text-xl transition-colors ${
                  hovered === "recruiter" ? "text-slate-900 dark:text-white" : "text-primary dark:text-white"
                }`}>
                  I&apos;m a Recruiter
                </h2>
                <p className={`text-xs leading-relaxed transition-colors ${
                  hovered === "recruiter" ? "text-slate-700 dark:text-slate-200" : "text-text-secondary dark:text-slate-400"
                }`}>
                  Post internships, review AI-scored CVs, shortlist candidates, and manage your hiring pipeline.
                </p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                hovered === "recruiter" ? "text-teal-dark dark:text-teal-300" : "text-text-muted dark:text-slate-400"
              }`}>
                Create Workspace <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Applicant Card */}
            <button
              onClick={() => router.push("/applicant-auth")}
              onMouseEnter={() => setHovered("applicant")}
              onMouseLeave={() => setHovered(null)}
              className={`group relative flex flex-col items-center gap-4 rounded-3xl border-2 p-8 text-center transition-all duration-200 cursor-pointer ${
                hovered === "applicant"
                  ? "border-purple-ai bg-purple-light dark:bg-purple-950/60 shadow-hover scale-[1.02]"
                  : "border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:border-purple-ai hover:shadow-hover"
              }`}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                hovered === "applicant" 
                  ? "bg-purple-ai text-white shadow-purple" 
                  : "bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 text-purple-ai dark:text-purple-400"
              }`}>
                <GraduationCap className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className={`font-display font-extrabold text-xl transition-colors ${
                  hovered === "applicant" ? "text-slate-900 dark:text-white" : "text-primary dark:text-white"
                }`}>
                  I&apos;m an Applicant
                </h2>
                <p className={`text-xs leading-relaxed transition-colors ${
                  hovered === "applicant" ? "text-slate-700 dark:text-slate-200" : "text-text-secondary dark:text-slate-400"
                }`}>
                  Browse open internships, apply with your CV, and track your application statuses all in one place.
                </p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                hovered === "applicant" ? "text-purple-ai dark:text-purple-300" : "text-text-muted dark:text-slate-400"
              }`}>
                Browse Internships <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-text-secondary dark:text-slate-300">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-teal-dark dark:text-teal-300 hover:underline">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
