"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Offline / reconnect banner. Shows a slim "You are offline" bar when the
 * connection drops (so users never see a raw browser error), and a brief
 * "Back online" toast when connectivity returns. Non-intrusive.
 */
export default function ConnectivityBanner() {
  const [offline, setOffline] = useState(false);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    const goOffline = () => {
      if (timer) window.clearTimeout(timer);
      setOffline(true);
      setJustBack(false);
    };
    const goOnline = () => {
      if (timer) window.clearTimeout(timer);
      setOffline(false);
      setJustBack(true);
      timer = window.setTimeout(() => setJustBack(false), 3500);
    };

    // Set initial state
    setOffline(!navigator.onLine);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline && !justBack) return null;

  if (justBack && !offline) {
    return (
      <div className="fixed bottom-4 left-1/2 z-[9990] -translate-x-1/2 animate-fade-up">
        <div className="flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald-light dark:bg-emerald-dark/30 px-4 py-2 text-xs font-semibold text-emerald-dark dark:text-emerald shadow-card">
          <Wifi className="h-3.5 w-3.5" />
          Back online — you&apos;re connected
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[9980] animate-fade-up">
      <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-dark via-teal to-emerald px-4 py-2 text-xs font-semibold text-white shadow-card">
        <WifiOff className="h-3.5 w-3.5" />
        You are offline — cached content still works. AI features will resume
        when you reconnect.
      </div>
    </div>
  );
}
