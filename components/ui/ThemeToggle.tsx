"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const currentIcon = options.find((o) => o.value === theme)?.icon ?? Sun;
  const Icon = currentIcon;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-slate-50 hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-all shadow-subtle"
        aria-label={`Theme: ${theme}`}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-border bg-white dark:border-slate-700 dark:bg-slate-800 shadow-ai overflow-hidden z-50"
          >
            {options.map((opt) => {
              const OptIcon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-light text-teal-dark dark:bg-teal/20 dark:text-teal"
                      : "text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  )}
                >
                  <OptIcon className="h-4 w-4" />
                  <span>{opt.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="theme-dot"
                      className="ml-auto h-2 w-2 rounded-full bg-teal"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
