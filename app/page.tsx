"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import Reveal from "@/components/ui/Reveal";

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
            className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal-light/60 dark:bg-teal/20 dark:border-teal/50 px-4 py-1.5 text-xs font-mono font-semibold text-teal-dark dark:text-teal-300 shadow-subtle mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal dark:text-teal-400" />
            <span>InternIQ — Next-Gen AI Recruitment SaaS</span>
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
              Get Started Now
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Log in to Dashboard
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
            {[
              { value: "10x", label: "Faster Candidate Screening", className: "text-primary" },
              { value: "99.4%", label: "CV Evidence Accuracy", className: "text-teal-dark" },
              { value: "0 Hours", label: "Manual Parsing Required", className: "text-purple-ai" },
              { value: "100%", label: "Recruiter Control Preserved", className: "text-emerald" },
            ].map((stat, idx) => (
              <Reveal key={stat.label} variant="fade-up" delay={idx * 0.08}>
                <div>
                  <div className={`font-display font-extrabold text-3xl sm:text-4xl ${stat.className}`}>
                    {stat.value}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
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
            <Reveal variant="fade-up" delay={0.05}>
              <FeatureCard
                icon={<Target className="h-6 w-6 text-teal" />}
                eyebrow="01 · Define Requirements"
                title="Tailored Screening Criteria"
                description="Specify required & preferred technical skills, academic qualifications, and custom screening questions for each role."
              />
            </Reveal>
            <Reveal variant="fade-up" delay={0.15}>
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-purple-ai" />}
                eyebrow="02 · Instant AI Analysis"
                title="Evidence Mapping Engine"
                description="InternIQ automatically extracts candidate evidence from PDF resumes, mapping projects and achievements directly to your specifications."
              />
            </Reveal>
            <Reveal variant="fade-up" delay={0.25}>
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6 text-emerald" />}
                eyebrow="03 · Modern Dashboard"
                title="Actionable Analytics Report"
                description="Review visual radial gauges, strength/weakness matrices, interview probability, and missing skills chips with one click."
              />
            </Reveal>
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
            <Reveal variant="slide-right" delay={0.05}>
              <StepItem
                step="1"
                title="Create Internship Wizard"
                description="Define role titles, work mode (Remote/On-site), duration, and screening requirements in seconds."
              />
            </Reveal>
            <Reveal variant="fade-up" delay={0.15}>
              <StepItem
                step="2"
                title="Share One Public Link"
                description="Applicants apply effortlessly without needing an account — uploading PDF CVs and answering screening questions."
              />
            </Reveal>
            <Reveal variant="slide-left" delay={0.25}>
              <StepItem
                step="3"
                title="Review AI Evidence Report"
                description="Get instant candidate rankings, AI match scores, strength breakdowns, and shortlist applicants with confidence."
              />
            </Reveal>
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
            <Reveal variant="fade-down" delay={0.05}>
              <FaqItem
                question="Does InternIQ replace recruiter decisions?"
                answer={
                  <div><p><strong>No.</strong> InternIQ is an evidence organizer, not a decision maker.</p><ul className="list-disc pl-5 space-y-1 mt-2"><li>It parses resumes and evaluates qualifications against your specific requirements</li><li>Provides transparent evidence mapping with source citations</li><li>Generates match scores based on objective criteria</li></ul><p className="mt-2">Recruiters always retain full control over hiring decisions — InternIQ delivers the evidence to make those decisions faster and more informed.</p></div>
                }
                isOpen={faqOpen === 0}
                onToggle={() => setFaqOpen(faqOpen === 0 ? null : 0)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.12}>
              <FaqItem
                question="Do applicants need an account to apply?"
                answer={
                  <div><p><strong>No account is required</strong> for applicants applying through public links.</p><p className="mt-2">Recruiters generate a unique application URL for each internship posting. Applicants can apply directly by uploading their CV and answering screening questions — no sign-up needed.</p><p className="mt-2">However, applicants who <em>choose</em> to create an account gain access to application tracking, AI-powered job recommendations, and profile management.</p></div>
                }
                isOpen={faqOpen === 1}
                onToggle={() => setFaqOpen(faqOpen === 1 ? null : 1)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.19}>
              <FaqItem
                question="What file formats are supported for CV analysis?"
                answer={
                  <div><p>InternIQ currently supports <strong>PDF format</strong> for CV analysis.</p><ul className="list-disc pl-5 space-y-1 mt-2"><li>Standard PDF documents up to 10 MB</li><li>Text-based PDFs are parsed for education, skills, projects, and experience</li><li>Scanned image PDFs may have limited extraction accuracy</li></ul><p className="mt-2">We recommend applicants upload text-based PDF resumes for the most accurate AI evidence mapping.</p></div>
                }
                isOpen={faqOpen === 2}
                onToggle={() => setFaqOpen(faqOpen === 2 ? null : 2)}
              />
            </Reveal>
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
            Create Your Account
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
  answer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-subtle transition-colors">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between p-5 text-left font-display font-bold text-base text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 ml-3"
        >
          <ChevronDown
            className={`h-5 w-5 transition-colors duration-300 ${
              isOpen ? "text-teal" : "text-text-muted dark:text-slate-500"
            }`}
          />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="faq-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-4 text-sm text-text-secondary dark:text-slate-300 leading-7 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
