"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  Search,
  Briefcase,
  Bookmark,
  FileText,
  Settings,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LogoutButton from "@/components/auth/LogoutButton";

const navItems = [
  { href: "/applicant", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/applicant/profile", label: "My Profile", icon: UserCircle },
  { href: "/applicant/internships", label: "Find Internships", icon: Search },
  { href: "/applicant/applications", label: "My Applications", icon: Briefcase },
  { href: "/applicant/saved", label: "Saved Jobs", icon: Bookmark },
  { href: "/applicant/resume", label: "Resume", icon: FileText },
  { href: "/applicant/settings", label: "Settings", icon: Settings },
];

export default function ApplicantSidebar({
  userEmail,
  userName,
}: {
  userEmail?: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white/90 px-4 py-3 backdrop-blur shadow-subtle">
        <Link href="/applicant" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-primary">
            InternIQ
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl border border-border p-2 text-text-secondary hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B1F3A] text-white transition-all duration-300 shadow-2xl",
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <Link href="/applicant" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-display text-xl font-extrabold tracking-tight text-white">
                  InternIQ
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-teal">
                  Applicant Portal
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-gradient-primary text-white shadow-teal font-semibold"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          {!collapsed && (userEmail || userName) && (
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/20 text-teal font-bold font-mono text-sm border border-teal/30 shrink-0">
                {(userName || userEmail || "A")[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {userName || "Applicant Account"}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {userEmail}
                </span>
              </div>
            </div>
          )}
          <div className={cn("flex", collapsed ? "justify-center" : "justify-between")}>
            <LogoutButton collapsed={collapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
