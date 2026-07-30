"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["⌘", "/"], description: "Focus search" },
  { keys: ["Esc"], description: "Close modals / Palettes" },
  { keys: ["↑", "↓"], description: "Navigate lists" },
  { keys: ["Enter"], description: "Select item / Open" },
  { keys: ["?"], description: "Open shortcuts dialog" },
  { keys: ["⌘", "D"], description: "Go to Dashboard" },
  { keys: ["⌘", "A"], description: "View Applications" },
  { keys: ["⌘", "N"], description: "Create Internship" },
  { keys: ["⌘", "T"], description: "Open Talent Pool" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeEl = document.activeElement?.tagName;
        if (activeEl !== "INPUT" && activeEl !== "TEXTAREA" && activeEl !== "SELECT") {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    // Listen for custom event from command palette
    const customHandler = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("open-shortcuts", customHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-shortcuts", customHandler);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-hover space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal-dark border border-teal/20 dark:bg-teal/20">
                    <Keyboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-primary dark:text-white">
                      Keyboard Shortcuts
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Speed up your workflow
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1 max-h-80 overflow-y-auto">
                {shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 px-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-sm text-text-primary dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <kbd
                          key={kidx}
                          className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md border border-border dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold text-text-secondary dark:text-slate-400"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border dark:border-slate-700 pt-3 text-center">
                <p className="text-[10px] text-text-muted font-mono">
                  Press <kbd className="rounded border border-border dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[10px]">?</kbd> to toggle this dialog
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
