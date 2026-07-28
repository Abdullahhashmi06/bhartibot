"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LogIn, UserPlus, Command } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export default function Navbar() {
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/dashboard");

  if (inDashboard) return null; // Dashboard uses Sidebar + Topbar

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-extrabold tracking-tight text-primary">
              InternIQ
            </span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-text-secondary">
              Discover Potential. Create Impact.
            </span>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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
            Get Started Free
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
