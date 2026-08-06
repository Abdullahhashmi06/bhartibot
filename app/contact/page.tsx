import type { Metadata } from "next";
import Shell from "@/components/layout/Shell";
import ContactForm from "@/components/contact/ContactForm";
import { MessageSquareText, Clock, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — InternIQ",
  description:
    "Get in touch with the InternIQ team. Questions, feedback, or partnership inquiries — we'd love to hear from you.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-8 py-10 px-4 sm:px-6">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-br from-teal-light/60 via-white to-emerald-light/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 sm:p-10 shadow-card">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-teal/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-emerald/10 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-slate-800/80 border border-teal/20 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-teal-dark dark:text-teal">
              <Sparkles className="h-3.5 w-3.5" /> We&apos;d love to hear from you
            </span>
            <h1 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl text-primary dark:text-white tracking-tight">
              Contact <span className="text-gradient">InternIQ</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-text-secondary dark:text-slate-400">
              Have a question about the platform, a feature request, or want to
              bring InternIQ to your organization? Send us a message and our
              team will get back to you as soon as possible.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CONTACT INFO SIDEBAR */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card space-y-5">
              <h2 className="font-display font-bold text-base text-primary dark:text-white border-b border-border dark:border-slate-700 pb-3">
                Other ways to reach us
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-light dark:bg-teal/15 text-teal-dark dark:text-teal border border-teal/20">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                      Contact Form
                    </p>
                    <p className="text-sm text-text-secondary dark:text-slate-300">
                      Send us a message using the form — it&apos;s the fastest way
                      to reach our team.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-light dark:bg-purple-ai/15 text-purple-ai dark:text-purple-300 border border-purple-ai/20">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                      Support
                    </p>
                    <p className="text-sm text-text-secondary dark:text-slate-300">
                      For account or technical issues, include your email so we
                      can assist faster.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-light dark:bg-emerald/15 text-emerald-dark dark:text-emerald border border-emerald/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                      Response Time
                    </p>
                    <p className="text-sm text-text-secondary dark:text-slate-300">
                      We usually reply within 1–2 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-teal/30 bg-teal-light/30 dark:bg-teal/10 p-6 space-y-2">
              <h3 className="font-display font-bold text-sm text-teal-dark dark:text-teal">
                Looking for help?
              </h3>
              <p className="text-xs text-text-secondary dark:text-slate-400">
                Check out our{" "}
                <a
                  href="/ai-disclaimer"
                  className="font-semibold text-teal-dark dark:text-teal hover:underline"
                >
                  Responsible AI
                </a>{" "}
                page or review the{" "}
                <a
                  href="/terms"
                  className="font-semibold text-teal-dark dark:text-teal hover:underline"
                >
                  Terms &amp; Conditions
                </a>
                .
              </p>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </Shell>
  );
}
