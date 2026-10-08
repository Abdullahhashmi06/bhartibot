"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, UserPlus, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/dashboard");
  const inApplicant = pathname === "/applicant" || pathname?.startsWith("/applicant/");

  if (inDashboard || inApplicant) return null; // Dashboard uses Sidebar + Topbar

  return (
    <header className="sticky top-0 z-40 border-b border-border dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center gap-2.5 transition-transform group-hover:scale-105">
            <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-teal to-emerald shadow-teal/20 shadow-lg">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="3" />
                <path d="M12 8v8" />
                <path d="M8 20l4-4 4 4" />
              </svg>
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5">
                <svg viewBox="0 0 12 12" className="h-full w-full text-teal" fill="currentColor">
                  <path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl tracking-tight text-primary dark:text-white">
                Intern<span className="text-gradient">IQ</span>
              </span>
              <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-text-secondary dark:text-slate-400">
                Discover Potential. Create Impact.
              </span>
            </div>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-5 text-sm font-medium text-text-secondary lg:flex"
        >
          <Link href="/#features" className="transition-colors hover:text-teal-dark">
            Features
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-teal-dark">
            How it works
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-teal-dark">
            FAQ
          </Link>
          <Link href="/ai-disclaimer" className="transition-colors hover:text-teal-dark">
            Responsible AI
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-slate-100 hover:text-teal-dark dark:hover:bg-slate-800 dark:hover:text-teal-300 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <ThemeToggle />
          <ButtonLink
            href="/login"
            variant="ghost"
            size="sm"
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            Log in
          </ButtonLink>
          <ButtonLink
            href="/signup"
            variant="gradient"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Create account</span>
            <span className="sm:hidden">Sign up</span>
          </ButtonLink>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={`${mobileMenuOpen ? "block" : "hidden"} space-y-1 border-t border-border px-4 py-3 dark:border-slate-800 lg:hidden`}
      >
        {[
          { href: "/#features", label: "Features" },
          { href: "/#how-it-works", label: "How it works" },
          { href: "/#faq", label: "FAQ" },
          { href: "/ai-disclaimer", label: "Responsible AI" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-slate-100 hover:text-teal-dark dark:hover:bg-slate-800 dark:hover:text-teal-300"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
