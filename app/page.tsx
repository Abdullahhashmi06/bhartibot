"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  FileCheck,
  CheckCircle2,
  Users,
  ChevronDown,
  BarChart3,
  Award,
} from "lucide-react";
import Shell from "@/components/layout/Shell";
import { ButtonLink } from "@/components/ui/Button";

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Shell>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background glow graphics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-teal/20 via-purple-ai/20 to-emerald/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal-light/50 px-4 py-1.5 text-xs font-mono font-semibold text-teal-dark shadow-subtle mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal" />
            <span>InternIQ 2.0 — Next-Gen AI Recruitment SaaS</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-primary max-w-4xl leading-[1.1]"
          >
            Discover Potential. <br />
            <span className="text-gradient">Create Impact.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base sm:text-xl text-text-secondary leading-relaxed font-sans"
          >
            Empower recruiters with automated CV evidence mapping, radial AI match scoring, and screening intelligence. You still make the hiring call — InternIQ delivers the evidence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <ButtonLink
              href="/signup"
              variant="gradient"
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Start Recruiter Workspace
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Log in to Dashboard
            </ButtonLink>
            <ButtonLink href="/applicant-auth" variant="outline" size="lg">
              For Applicants
            </ButtonLink>
          </motion.div>

          {/* MOCKUP ILLUSTRATION AREA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-white p-3 sm:p-4 shadow-2xl relative"
          >
            <div className="rounded-2xl border border-border/80 bg-slate-900 p-6 text-white text-left space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    InternIQ AI Candidate Synthesizer — Production Preview
                  </span>
                </div>
                <span className="font-mono text-xs bg-purple-ai/30 text-purple-light border border-purple-ai/40 px-3 py-1 rounded-full">
                  Score: 92% Highly Recommended
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                    <div>
                      <h4 className="font-display text-lg font-bold text-white">
                        Ayesha Khan — Machine Learning Applicant
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        National University of Sciences and Technology · 3.85 CGPA
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald/20 text-emerald text-xs font-mono font-bold">
                      Shortlisted
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                      Requirement Evidence Mapping
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-lg">
                        <span>Python & PyTorch Experience</span>
                        <span className="text-emerald font-bold">✓ 3 Projects Verified</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-lg">
                        <span>Data Preprocessing & Pandas</span>
                        <span className="text-emerald font-bold">✓ Demonstrated</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-ai/20 to-teal/20 p-5 rounded-2xl border border-white/10 flex flex-col justify-between items-center text-center">
                  <div className="font-mono text-xs uppercase text-slate-300 tracking-wider">
                    AI Match Index
                  </div>
                  <div className="font-display font-extrabold text-5xl text-gradient my-2">
                    92%
                  </div>
                  <p className="text-xs text-slate-300">
                    High probability for interview success based on screening criteria.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATISTICS BANNER */}
      <section className="border-y border-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-primary">
                10x
              </div>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                Faster Candidate Screening
              </p>
            </div>
            <div>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-teal-dark">
                99.4%
              </div>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                CV Evidence Accuracy
              </p>
            </div>
            <div>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-purple-ai">
                0h
              </div>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                Manual Parsing Time
              </p>
            </div>
            <div>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-emerald">
                100%
              </div>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                Recruiter Control Preserved
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal">
              Engineered for Excellence
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-primary tracking-tight">
              Everything you need to hire top talent effortlessly.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="h-6 w-6 text-teal" />}
              eyebrow="01 · Define Requirements"
              title="Tailored Screening Criteria"
              description="Specify required & preferred technical skills, academic qualifications, and custom screening questions for each role."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-purple-ai" />}
              eyebrow="02 · Instant AI Analysis"
              title="Evidence Mapping Engine"
              description="InternIQ automatically extracts candidate evidence from PDF resumes, mapping projects and achievements directly to your specifications."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-emerald" />}
              eyebrow="03 · Modern Dashboard"
              title="Actionable Analytics Report"
              description="Review visual radial gauges, strength/weakness matrices, interview probability, and missing skills chips with one click."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-white border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-primary">
              How InternIQ Works
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              A 3-step streamlined workflow designed for high-efficiency hiring teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepItem
              step="1"
              title="Create Internship Wizard"
              description="Define role titles, work mode (Remote/On-site), duration, and screening requirements in seconds."
            />
            <StepItem
              step="2"
              title="Share One Public Link"
              description="Applicants apply effortlessly without needing an account — uploading PDF CVs and answering screening questions."
            />
            <StepItem
              step="3"
              title="Review AI Evidence Report"
              description="Get instant candidate rankings, AI match scores, strength breakdowns, and shortlist applicants with confidence."
            />
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <h2 className="font-display font-extrabold text-3xl text-primary">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <FaqItem
              question="Does InternIQ replace recruiter decisions?"
              answer="No. InternIQ is an evidence organizer. It parses resumes and evaluates qualifications against your requirements, providing transparent evidence mapping so recruiters can make informed decisions faster."
              isOpen={faqOpen === 0}
              onToggle={() => setFaqOpen(faqOpen === 0 ? null : 0)}
            />
            <FaqItem
              question="Do applicants need an account to apply?"
              answer="No account is required for applicants. Recruiters simply share the generated public application URL."
              isOpen={faqOpen === 1}
              onToggle={() => setFaqOpen(faqOpen === 1 ? null : 1)}
            />
            <FaqItem
              question="What file formats are supported for CV analysis?"
              answer="InternIQ parses standard PDF CV uploads to extract education, technical skills, and project experience."
              isOpen={faqOpen === 2}
              onToggle={() => setFaqOpen(faqOpen === 2 ? null : 2)}
            />
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-20 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial-ai opacity-30 pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
            Ready to transform your recruitment process?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-lg">
            Join forward-thinking recruiting teams using InternIQ to discover potential and make data-backed hiring decisions.
          </p>
          <ButtonLink
            href="/signup"
            variant="gradient"
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Create Your Free Account
          </ButtonLink>
        </div>
      </section>
    </Shell>
  );
}

function FeatureCard({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px -4px rgba(11, 31, 58, 0.1)" }}
      className="rounded-2xl border border-border bg-white p-8 shadow-card space-y-4 text-left transition-all"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
        {icon}
      </div>
      <span className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        {eyebrow}
      </span>
      <h3 className="font-display font-bold text-xl text-primary">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepItem({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-slate-50 p-6 space-y-3 relative">
      <div className="font-mono text-2xl font-extrabold text-teal">{step}</div>
      <h3 className="font-display font-bold text-lg text-primary">{title}</h3>
      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left font-display font-bold text-base text-primary hover:bg-slate-50 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-text-muted transition-transform ${
            isOpen ? "rotate-180 text-teal" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="p-5 pt-0 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-slate-100">
          {answer}
        </div>
      )}
    </div>
  );
}
