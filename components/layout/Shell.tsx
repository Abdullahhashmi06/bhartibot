"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import CommandPaletteEnhanced from "@/components/ui/CommandPaletteEnhanced";
import KeyboardShortcuts from "@/components/ui/KeyboardShortcuts";
import { Toaster } from "sonner";

export default function Shell({
  children,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/talent-pool") || pathname?.startsWith("/internships/");

  if (inDashboard) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col lg:flex-row antialiased">
        <CommandPaletteEnhanced />
        <KeyboardShortcuts />
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            className: "dark:bg-slate-800 dark:text-white dark:border-slate-700",
            duration: 3000,
          }}
        />
        <Sidebar userEmail={userEmail} userName={userName} />

        <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 page-enter">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-slate-950 antialiased">
      <CommandPaletteEnhanced />
      <KeyboardShortcuts />
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          className: "dark:bg-slate-800 dark:text-white dark:border-slate-700",
        }}
      />
      <Navbar />
      <main className="flex-1 page-enter">{children}</main>

      {/* ===================================================================
          FOOTER — CREDITS SECTION (CONFIGURABLE)
          -----------------------------------------------------------------
          This footer section is intentionally configurable.
          Personal names or attributions may be added below after final
          approval. Do NOT hardcode personal names throughout the app.
          To add credits, edit the FOOTER_CREDITS constant below.
          This section may be removed or modified after final approval.
          =================================================================== */}
      <footer className="border-t border-border dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted">
          <div>
            <span className="font-bold text-primary dark:text-white">InternIQ</span> · Discover Potential. Create Impact.
          </div>
<<<<<<< Updated upstream
          <div>
            © {new Date().getFullYear()} InternIQ AI Recruitment SaaS. All rights reserved.
=======
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="text-center sm:text-right space-y-1">
              <div>
                © {new Date().getFullYear()} InternIQ AI Recruitment SaaS. All rights reserved.
              </div>
              <div className="text-text-muted dark:text-slate-500">
                Developed by{" "}
                <span className="font-semibold text-primary dark:text-slate-200">Abdullah Hashmi</span>
                {" "}and{" "}
                <span className="font-semibold text-primary dark:text-slate-200">Umer Sheikh</span>
              </div>
            </div>
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] uppercase tracking-wider"
            >
              <Link href="/privacy" className="hover:text-teal-dark dark:hover:text-teal-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-teal-dark dark:hover:text-teal-300 transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/ai-disclaimer" className="hover:text-teal-dark dark:hover:text-teal-300 transition-colors">
                Responsible AI
              </Link>
              <Link href="/contact" className="hover:text-teal-dark dark:hover:text-teal-300 transition-colors">
                Contact
              </Link>
            </nav>
>>>>>>> Stashed changes
          </div>
        </div>
      </footer>
    </div>
  );
}
