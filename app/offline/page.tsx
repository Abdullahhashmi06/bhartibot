"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Offline fallback page — served by the service worker whenever a navigation
 * fails while the device is offline. It is precached via
 * additionalPrecacheEntries so it always renders.
 */
export default function OfflinePage() {
  const [checking, setChecking] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    // Reset the redirect guard whenever the user drops offline again, so a
    // later reconnect in the same session auto-redirects instead of leaving
    // the user stranded on /offline.
    const wentOffline = () => {
      sessionStorage.removeItem("interniq-offline-redirect");
      setOnline(false);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", wentOffline);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", wentOffline);
    };
  }, []);

  // Auto-redirect when connection returns — guarded so a server error (not a
  // real disconnect) can't bounce /offline → / → /offline in a loop.
  useEffect(() => {
    if (!online) return;
    const alreadyRedirected = sessionStorage.getItem("interniq-offline-redirect");
    if (alreadyRedirected) return;
    sessionStorage.setItem("interniq-offline-redirect", "1");
    window.location.href = "/";
  }, [online]);

  const retry = () => {
    setChecking(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-up">
        {/* Logo */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-teal">
          <img
            src="/icons/icon-512.png"
            alt="InternIQ"
            className="h-16 w-16 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-mono font-semibold text-warning">
            <WifiOff className="h-3.5 w-3.5" /> You&apos;re offline
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-primary dark:text-white tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-sm text-text-secondary dark:text-slate-400 leading-relaxed">
            Some content is still available. Reconnect to continue using
            InternIQ&apos;s AI features.
          </p>
        </div>

        {/* Offline illustration */}
        <svg
          viewBox="0 0 120 80"
          className="mx-auto h-32 w-48 text-teal dark:text-teal-light"
          aria-hidden="true"
        >
          <path
            d="M10 62 Q30 30 55 50 T95 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M20 62 Q40 40 62 52 T100 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 5"
            strokeLinecap="round"
            opacity="0.4"
          />
          <circle cx="95" cy="40" r="4" fill="currentColor" opacity="0.5" />
          <circle cx="55" cy="50" r="3" fill="currentColor" opacity="0.7" />
          <circle cx="30" cy="30" r="2.5" fill="currentColor" opacity="0.4" />
        </svg>

        <button
          onClick={retry}
          disabled={checking}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-teal hover:opacity-95 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Reconnecting..." : "Retry Connection"}
        </button>

        <p className="text-[11px] font-mono text-text-muted dark:text-slate-500">
          InternIQ · AI-Powered Internship Platform
        </p>
      </div>
    </div>
  );
}
