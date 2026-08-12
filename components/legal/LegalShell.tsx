import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  FileText,
  BrainCircuit,
  Mail,
  Clock,
} from "lucide-react";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/ai-disclaimer", label: "Responsible AI" },
  { href: "/contact", label: "Contact" },
];

const PAGE_META: Record<
  string,
  { eyebrow: string; title: React.ReactNode; subtitle: string; icon: React.ReactNode }
> = {
  privacy: {
    eyebrow: "Legal · Privacy",
    title: (
      <>
        Privacy <span className="text-gradient">Policy</span>
      </>
    ),
    subtitle:
      "How InternIQ collects, uses, protects, and handles your information when you use our platform.",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  terms: {
    eyebrow: "Legal · Terms",
    title: (
      <>
        Terms of <span className="text-gradient">Service</span>
      </>
    ),
    subtitle:
      "The rules and responsibilities that govern your use of the InternIQ platform.",
    icon: <FileText className="h-6 w-6" />,
  },
  ai: {
    eyebrow: "Responsible AI",
    title: (
      <>
        Responsible <span className="text-gradient">AI Disclaimer</span>
      </>
    ),
    subtitle:
      "How InternIQ uses artificial intelligence, what it can and cannot do, and what it means for you.",
    icon: <BrainCircuit className="h-6 w-6" />,
  },
};

export default function LegalShell({
  page,
  lastUpdated,
  children,
}: {
  page: "privacy" | "terms" | "ai";
  lastUpdated: string;
  children: React.ReactNode;
}) {
  const meta = PAGE_META[page];

  return (
    <div className="bg-background dark:bg-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-teal/15 via-purple-ai/10 to-emerald/15 blur-[110px] pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal-light/60 dark:bg-teal/20 dark:border-teal/50 px-4 py-1.5 text-xs font-mono font-semibold text-teal-dark dark:text-teal-300 shadow-subtle mb-6">
            <Sparkles className="h-3.5 w-3.5 text-teal dark:text-teal-400" />
            <span>InternIQ — {meta.eyebrow}</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-primary dark:text-white leading-[1.1]">
            {meta.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-text-secondary dark:text-slate-300 leading-relaxed">
            {meta.subtitle}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-mono text-text-muted dark:text-slate-400 shadow-subtle">
            <Clock className="h-3.5 w-3.5 text-teal" />
            Last updated: {lastUpdated}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 page-enter">
        {children}

        {/* CONTACT CARD */}
        <section className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-light dark:bg-teal/20 text-teal-dark border border-teal/20 shadow-teal">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-primary dark:text-white">
            Questions? Contact Us
          </h2>
          <p className="mx-auto max-w-md text-sm text-text-secondary dark:text-slate-300 leading-relaxed">
            If you have any questions about this policy or how InternIQ handles
            your data, reach out to our team and we&apos;ll be happy to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-xs font-semibold text-white shadow-teal hover:opacity-95 transition-all"
          >
            <Mail className="h-4 w-4" />
            Contact Our Team
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary dark:text-white">InternIQ</span>
            <span>· Discover Potential. Create Impact.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-teal-dark dark:hover:text-teal-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center text-[11px] font-mono text-text-muted dark:text-slate-500">
          © {new Date().getFullYear()} InternIQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable content primitives                                        */
/* ------------------------------------------------------------------ */

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-4"
    >
      <h2 className="flex items-center gap-2 font-display font-bold text-xl sm:text-2xl text-primary dark:text-white">
        {title}
      </h2>
      <div className="space-y-4 text-sm text-text-secondary dark:text-slate-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalSubheading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="pt-2 font-display font-semibold text-base text-primary dark:text-white">
      {children}
    </h3>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-teal to-emerald" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-teal/25 bg-teal-light/50 dark:bg-teal/10 px-4 py-3.5 text-xs sm:text-sm text-text-secondary dark:text-slate-300 leading-relaxed">
      {children}
    </div>
  );
}

export function LegalStrong({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-primary dark:text-white">
      {children}
    </strong>
  );
}
