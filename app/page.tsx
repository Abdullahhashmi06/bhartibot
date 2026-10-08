"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Target,
  ChevronDown,
  BarChart3,
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
            Screen internship applicants with evidence-backed AI reports that
            show how each CV aligns with your role requirements. You review the
            evidence and make every hiring decision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <ButtonLink
              href="/signup/recruiter"
              variant="gradient"
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Create a Recruiter Account
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Log in
            </ButtonLink>
          </motion.div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden="true" />
              Recruiters make every hiring decision
            </span>
            <Link
              href="/privacy#storage"
              className="inline-flex items-center gap-1.5 underline decoration-teal/40 underline-offset-4 hover:text-teal-dark"
            >
              <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
              CVs use private storage
            </Link>
            <Link
              href="/ai-disclaimer"
              className="underline decoration-teal/40 underline-offset-4 hover:text-teal-dark"
            >
              Read about AI limitations
            </Link>
          </div>

          {/* MOCKUP ILLUSTRATION AREA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-white p-3 sm:p-4 shadow-2xl relative"
          >
            <div className="rounded-2xl border border-border/80 bg-slate-900 p-6 text-white text-left space-y-6">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    Illustrative sample report · fictional data
                  </span>
                </div>
                <span className="self-start rounded-full border border-purple-ai/40 bg-purple-ai/30 px-3 py-1 font-mono text-xs text-purple-light sm:self-auto">
                  Example only
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                    <div>
                      <h4 className="font-display text-lg font-bold text-white">
                        Sample candidate — Machine Learning Intern
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Fictional profile · illustrative evidence
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald/20 text-emerald text-xs font-mono font-bold">
                      Recruiter review
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                      Requirement Evidence Mapping
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-lg">
                        <span>Python & PyTorch Experience</span>
                        <span className="text-emerald font-bold">Evidence listed</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-lg">
                        <span>Data Preprocessing & Pandas</span>
                        <span className="text-emerald font-bold">Evidence listed</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-ai/20 to-teal/20 p-5 rounded-2xl border border-white/10 flex flex-col justify-between items-center text-center">
                  <div className="font-mono text-xs uppercase text-slate-300 tracking-wider">
                    Match to role criteria
                  </div>
                  <div className="font-display font-extrabold text-4xl text-gradient my-2">
                    Strong
                  </div>
                  <p className="text-xs text-slate-300">
                    Illustrative match only. A recruiter reviews the evidence and makes the decision.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section id="features" className="scroll-mt-24 py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal">
              Evidence to support your decisions
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-primary tracking-tight">
              Spend less time sorting CVs and more time reviewing the evidence.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Reveal variant="fade-up" delay={0.05}>
              <FeatureCard
                icon={<Target className="h-6 w-6 text-teal" />}
                eyebrow="01 · Define Requirements"
                title="Set consistent role criteria"
                description="Choose the required and preferred skills, qualifications, and screening questions you want to use for each internship."
              />
            </Reveal>
            <Reveal variant="fade-up" delay={0.15}>
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-purple-ai" />}
                eyebrow="02 · AI-assisted review"
                title="See evidence behind each match"
                description="Review extracted details from PDF CVs alongside the role criteria, then check the source material for context."
              />
            </Reveal>
            <Reveal variant="fade-up" delay={0.25}>
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6 text-emerald" />}
                eyebrow="03 · Modern Dashboard"
                title="Compare applicants consistently"
                description="Use role-based match summaries and evidence to guide your review. InternIQ supports your assessment; it does not predict interview or job success."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="scroll-mt-24 py-20 bg-white border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-primary">
              How InternIQ Works
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              Set role criteria, share an application link, then review candidate evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Reveal variant="slide-right" delay={0.05}>
              <StepItem
                step="1"
                title="Create an internship"
                description="Define the role, work mode, duration, and the criteria you want to review."
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
                title="Review candidate evidence"
                description="Compare extracted evidence against your criteria and decide which applicants to follow up with."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section id="faq" className="scroll-mt-24 py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <h2 className="font-display font-extrabold text-3xl text-primary">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <Reveal variant="fade-down" delay={0.05}>
              <FaqItem
                question="Does InternIQ automatically reject or select candidates?"
                answer={
                  <p>
                    No. InternIQ provides AI-assisted analysis and match summaries
                    against the criteria configured for a role. Recruiters must
                    review the evidence and make all hiring decisions. Read the{" "}
                    <Link href="/ai-disclaimer" className="font-semibold text-teal-dark underline underline-offset-2">
                      Responsible AI guidance
                    </Link>
                    .
                  </p>
                }
                isOpen={faqOpen === 0}
                onToggle={() => setFaqOpen(faqOpen === 0 ? null : 0)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.12}>
              <FaqItem
                question="How accurate are InternIQ's AI analyses?"
                answer={
                  <p>
                    AI analysis can be incomplete or incorrect, and InternIQ does
                    not guarantee accuracy. Use match summaries as a starting
                    point, review the CV and supporting evidence, and do not treat
                    a score as a prediction of interview or job success. See{" "}
                    <Link href="/ai-disclaimer#possible-inaccuracies" className="font-semibold text-teal-dark underline underline-offset-2">
                      possible AI inaccuracies
                    </Link>
                    .
                  </p>
                }
                isOpen={faqOpen === 1}
                onToggle={() => setFaqOpen(faqOpen === 1 ? null : 1)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.19}>
              <FaqItem
                question="How does InternIQ address potential bias?"
                answer={
                  <p>
                    AI systems may reflect biases in their training data. Review
                    each applicant fairly, follow your organization&apos;s
                    policies, and do not rely on an AI score alone. Our{" "}
                    <Link href="/ai-disclaimer#possible-inaccuracies" className="font-semibold text-teal-dark underline underline-offset-2">
                      Responsible AI page
                    </Link>{" "}
                    explains known limitations.
                  </p>
                }
                isOpen={faqOpen === 2}
                onToggle={() => setFaqOpen(faqOpen === 2 ? null : 2)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.23}>
              <FaqItem
                question="How are uploaded CVs stored and retained?"
                answer={
                  <p>
                    CVs are held in private storage with restricted access
                    controls. Information needed for AI features may be sent to
                    AI service providers. The{" "}
                    <Link href="/privacy" className="font-semibold text-teal-dark underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    {" "}says data is retained only as long as needed to provide
                    the service, meet legal obligations, or resolve disputes;
                    it does not specify a fixed retention period.
                  </p>
                }
                isOpen={faqOpen === 3}
                onToggle={() => setFaqOpen(faqOpen === 3 ? null : 3)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.27}>
              <FaqItem
                question="Do applicants need an account to apply?"
                answer={
                  <p>
                    No. Applicants can apply through a recruiter&apos;s public
                    internship link without creating an account. Applicants who
                    choose to create one can also access application tracking,
                    job recommendations, and profile management.
                  </p>
                }
                isOpen={faqOpen === 4}
                onToggle={() => setFaqOpen(faqOpen === 4 ? null : 4)}
              />
            </Reveal>
            <Reveal variant="fade-down" delay={0.31}>
              <FaqItem
                question="What file formats and sizes are supported for CV analysis?"
                answer={
                  <p>
                    CV analysis supports PDF files. Uploads are limited to 8 MB,
                    while the AI analysis path accepts files up to 5 MB. Keep a
                    CV at 5 MB or less for AI analysis. Text-based PDFs generally
                    extract more reliably; scanned PDFs may be incomplete.
                  </p>
                }
                isOpen={faqOpen === 5}
                onToggle={() => setFaqOpen(faqOpen === 5 ? null : 5)}
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
            Organize applications, compare role-related evidence, and make informed hiring decisions with recruiter-led AI support.
          </p>
          <ButtonLink
            href="/signup/recruiter"
            variant="gradient"
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Create a Recruiter Account
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
