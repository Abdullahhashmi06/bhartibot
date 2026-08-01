"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import {
  getRegistration,
  onControllerChange,
  skipWaiting,
} from "@/lib/pwa/sw-register";

/**
 * "A new version of InternIQ is available" banner. Detects a waiting service
 * worker and lets the user refresh now (activates it via SKIP_WAITING) or
 * dismiss. Safely no-ops when the SW is unavailable.
 */
export default function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cleanupReg: (() => void) | undefined;
    let cleanupCtrl: (() => void) | undefined;

    const setup = async () => {
      const reg = await getRegistration();
      if (cancelled || !reg) return;

      const onUpdateFound = () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // A new version is installed but waiting — offer refresh
            setUpdateAvailable(true);
          }
        });
      };

      reg.addEventListener("updatefound", onUpdateFound);
      cleanupReg = () => reg.removeEventListener("updatefound", onUpdateFound);

      // Auto-reload once the new SW takes control after SKIP_WAITING
      cleanupCtrl = onControllerChange(() => {
        if (!cancelled) window.location.reload();
      });
    };

    void setup();

    return () => {
      cancelled = true;
      cleanupReg?.();
      cleanupCtrl?.();
    };
  }, []);

  const refreshNow = async () => {
    await skipWaiting();
    // If no waiting worker, just reload
    window.setTimeout(() => window.location.reload(), 500);
  };

  const dismiss = () => setDismissed(true);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9970] max-w-sm w-[calc(100vw-2rem)] animate-fade-up">
      <div className="rounded-2xl border border-teal/30 bg-white dark:bg-slate-800 p-4 shadow-hover">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-display font-bold text-sm text-primary dark:text-white">
              A new version of InternIQ is available
            </p>
            <p className="text-[11px] text-text-secondary dark:text-slate-400">
              Refresh to get the latest features and fixes.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss update prompt"
            className="rounded-lg p-1 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={refreshNow}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-teal hover:opacity-95 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Now
        </button>
      </div>
    </div>
  );
}
