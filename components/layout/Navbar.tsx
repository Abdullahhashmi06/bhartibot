"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

export default function Navbar() {
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/dashboard");

  return (
    <header className="border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href={inDashboard ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <span className="font-display text-xl font-semibold text-ink">
            BhartiBot
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted sm:inline">
            evidence, not guesswork
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {!inDashboard && navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "text-text hover:bg-ink/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
