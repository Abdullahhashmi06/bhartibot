"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LogIn, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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
            Sign Up
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

