"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, Briefcase, Users, PlusCircle, Home, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const items = [
    {
      id: "dash",
      label: "Go to Dashboard",
      icon: <Home className="h-4 w-4 text-teal" />,
      action: () => router.push("/dashboard"),
    },
    {
      id: "create",
      label: "Create New Internship Wizard",
      icon: <PlusCircle className="h-4 w-4 text-purple-ai" />,
      action: () => router.push("/dashboard/create-internship"),
    },
    {
      id: "apps",
      label: "View All Applications",
      icon: <Users className="h-4 w-4 text-emerald" />,
      action: () => router.push("/dashboard/applications"),
    },
    {
      id: "home",
      label: "Landing Page",
      icon: <Briefcase className="h-4 w-4 text-info" />,
      action: () => router.push("/"),
    },
    {
      id: "logout",
      label: "Log Out",
      icon: <LogOut className="h-4 w-4 text-danger" />,
      action: async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      },
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
          >
            <div className="flex items-center border-b border-border px-4 py-3 gap-2">
              <Search className="h-4 w-4 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full text-sm bg-transparent border-0 focus:outline-none placeholder:text-text-muted text-text-primary"
                autoFocus
              />
              <span className="flex items-center gap-0.5 rounded border border-border bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                <Command className="h-3 w-3" /> K
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-xs text-text-muted">
                  No commands found.
                </p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-text-primary hover:bg-teal-light hover:text-teal-dark transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
