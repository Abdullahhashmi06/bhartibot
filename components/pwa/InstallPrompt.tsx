"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { isStandalone } from "@/lib/pwa/sw-register";

/**
 * Install prompt — a small, dismissible floating card shown only when the
 * browser fires `beforeinstallprompt` (Chrome/Edge/Android) or on iOS when
 * the app is not already installed. Dismissals are remembered so it is never
 * annoying, and it never shows once installed.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isStandalone()) return;

    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // Respect prior dismissal — 7-day cooldown so the card only shows
    // occasionally and never nags.
    const lastDismissed = Number(
      localStorage.getItem("interniq-install-dismissed-at") || "0"
    ) || 0;
    if (Date.now() - lastDismissed < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => setDismissed(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);

    if (isIOS) {
      setIsIos(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem("interniq-install-dismissed-at", String(Date.now()));
    setDismissed(true);
  };

  if (!mounted || dismissed || isStandalone()) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9970] max-w-xs w-[calc(100vw-2rem)] animate-fade-up">
      <div className="rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-hover">
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="absolute top-2.5 right-2.5 rounded-lg p-1 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-teal">
            <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-primary dark:text-white">
              Install InternIQ
            </p>
            <p className="text-[11px] text-text-secondary dark:text-slate-400">
              {isIos
                ? "Tap Share, then Add to Home Screen."
                : "Get the app for faster access & offline support."}
            </p>
          </div>
        </div>

        {!isIos && (
          <button
            onClick={install}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-teal hover:opacity-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Install
          </button>
        )}
      </div>
    </div>
  );
}
