"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import CommandPalette from "@/components/ui/CommandPalette";

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
  const inDashboard = pathname?.startsWith("/dashboard");

  if (inDashboard) {
    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row antialiased">
        <CommandPalette />
        <Sidebar userEmail={userEmail} userName={userName} />

        <main className="flex-1 lg:pl-64 min-w-0 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background antialiased">
      <CommandPalette />
      <Navbar />
      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted">
          <div>
            <span className="font-bold text-primary">InternIQ</span> · Discover Potential. Create Impact.
          </div>
          <div>
            © {new Date().getFullYear()} InternIQ AI Recruitment SaaS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
