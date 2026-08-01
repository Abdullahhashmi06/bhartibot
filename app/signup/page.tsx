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
                  ? "border-teal bg-teal-light shadow-hover scale-[1.02]"
                  : "border-border bg-white shadow-card hover:border-teal hover:shadow-hover"
              }`}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                hovered === "recruiter" ? "bg-teal text-white shadow-teal" : "bg-slate-50 border border-border text-teal"
              }`}>
                <Briefcase className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-extrabold text-xl text-primary">
                  I&apos;m a Recruiter
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Post internships, review AI-scored CVs, shortlist candidates, and manage your hiring pipeline.
                </p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                hovered === "recruiter" ? "text-teal-dark" : "text-text-muted"
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
                  ? "border-purple-ai bg-purple-light shadow-hover scale-[1.02]"
                  : "border-border bg-white shadow-card hover:border-purple-ai hover:shadow-hover"
              }`}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                hovered === "applicant" ? "bg-purple-ai text-white" : "bg-slate-50 border border-border text-purple-ai"
              }`}>
                <GraduationCap className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-extrabold text-xl text-primary">
                  I&apos;m an Applicant
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Browse open internships, apply with your CV, and track your application statuses all in one place.
                </p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                hovered === "applicant" ? "text-purple-ai" : "text-text-muted"
              }`}>
                Browse Internships <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-teal-dark hover:underline">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
