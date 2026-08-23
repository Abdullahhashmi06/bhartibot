"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  Users,
  PlusCircle,
  Home,
  LogOut,
  Sparkles,
  GraduationCap,
  Star,
  TrendingUp,
  HelpCircle,
  X,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: "navigation" | "actions" | "search";
  action: () => void;
  shortcut?: string;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function CommandPaletteEnhanced() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const debouncedQuery = useDebounce(query, 150);

  useEffect(() => {
    const stored = localStorage.getItem("interniq-recent-searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        setActiveIndex(0);
      }
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector<HTMLButtonElement>(`[data-index="${activeIndex}"]`);
      if (active) {
        active.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  const allItems: CommandItem[] = [
    {
      id: "dash",
      label: "Go to Dashboard",
      description: "View your recruitment overview",
      icon: <Home className="h-4 w-4 text-teal" />,
      category: "navigation",
      action: () => router.push("/dashboard"),
      shortcut: "\u2318D",
    },
    {
      id: "create",
      label: "Create Internship",
      description: "Start a new internship drive",
      icon: <PlusCircle className="h-4 w-4 text-purple-ai" />,
      category: "navigation",
      action: () => router.push("/dashboard/create-internship"),
      shortcut: "\u2318N",
    },
    {
      id: "apps",
      label: "View All Applications",
      description: "Browse all candidates across roles",
      icon: <Users className="h-4 w-4 text-emerald" />,
      category: "navigation",
      action: () => router.push("/dashboard/applications"),
      shortcut: "\u2318A",
    },
    {
      id: "talent",
      label: "Open Talent Pool",
      description: "View your saved candidates",
      icon: <Star className="h-4 w-4 text-amber-400" />,
      category: "navigation",
      action: () => router.push("/talent-pool"),
      shortcut: "\u2318T",
    },
    {
      id: "skills-search",
      label: "Search by Skill",
      description: "Find candidates with specific skills",
      icon: <Sparkles className="h-4 w-4 text-info" />,
      category: "search",
      action: () => router.push("/dashboard/search?tab=skills"),
    },
    {
      id: "uni-search",
      label: "Search by University",
      description: "Browse candidates by university",
      icon: <GraduationCap className="h-4 w-4 text-teal" />,
      category: "search",
      action: () => router.push("/dashboard/search?tab=universities"),
    },
    {
      id: "trending",
      label: "View Analytics",
      description: "Check recruitment metrics and trends",
      icon: <TrendingUp className="h-4 w-4 text-emerald" />,
      category: "navigation",
      action: () => router.push("/dashboard"),
    },
    {
      id: "home",
      label: "Landing Page",
      icon: <Briefcase className="h-4 w-4 text-text-secondary" />,
      category: "navigation",
      action: () => router.push("/"),
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      description: "View all available shortcuts",
      icon: <HelpCircle className="h-4 w-4 text-amber-400" />,
      category: "actions",
      action: () => {
        setOpen(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open-shortcuts"));
        }, 100);
      },
      shortcut: "?",
    },
    {
      id: "logout",
      label: "Log Out",
      icon: <LogOut className="h-4 w-4 text-danger" />,
      category: "actions",
      action: async () => {
        queryClient.clear();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      },
    },
  ];

  const filtered = allItems.filter((item) => {
    if (!debouncedQuery) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.category === "search" && item.label) {
        const newRecents = [item.label, ...recentSearches.filter((s) => s !== item.label)].slice(0, 10);
        setRecentSearches(newRecents);
        localStorage.setItem("interniq-recent-searches", JSON.stringify(newRecents));
      }
      item.action();
      setOpen(false);
      setQuery("");
    },
    [recentSearches]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = filtered;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      handleSelect(items[activeIndex]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setQuery("");
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="flex items-center border-b border-border dark:border-slate-700 px-4 py-3 gap-2">
              <Search className="h-5 w-5 text-text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search everything \u2014 applicants, skills, universities, roles..."
                className="w-full text-sm bg-transparent border-0 focus:outline-none placeholder:text-text-muted text-text-primary dark:text-white"
                autoFocus
                aria-label="Command palette search"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-border dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                ESC
              </kbd>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded-lg p-1 text-text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-0.5" role="listbox" aria-label="Search results">
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-3">
                    <Search className="h-10 w-10 text-text-muted opacity-30" />
                  </div>
                  <p className="text-sm font-medium text-text-secondary">No results found</p>
                  <p className="text-xs text-text-muted mt-1">Try a different search term</p>
                </div>
              ) : (
                <>
                  {!debouncedQuery && (
                    <div className="px-2 py-1.5">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Quick Actions
                      </span>
                    </div>
                  )}
                  {filtered.map((item, index) => (
                    <button
                      key={item.id}
                      data-index={index}
                      role="option"
                      aria-selected={index === activeIndex}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left",
                        index === activeIndex
                          ? "bg-teal-light text-teal-dark dark:bg-teal/20 dark:text-teal"
                          : "text-text-primary dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.description && (
                          <span className="block text-[11px] text-text-muted truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className="shrink-0 rounded-md border border-border dark:border-slate-600 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="border-t border-border dark:border-slate-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">\u2191\u2193</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">\u21B5</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">ESC</kbd>
                  Close
                </span>
              </div>
              <span className="font-mono text-[10px] text-text-muted">
                \u2318K
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
