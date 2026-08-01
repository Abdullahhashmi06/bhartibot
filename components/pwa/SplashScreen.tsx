"use client";

import { useEffect, useState } from "react";

/**
 * Native loading screen — shows the InternIQ logo + "Preparing your AI
 * workspace..." on launch and fades out once the app has hydrated and the
 * window has loaded. Replaces the blank white flash with a branded splash.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const hide = () => setVisible(false);

    // Fade out on window load, but keep a minimum display time so the splash
    // never flashes by too quickly.
    const minTime = window.setTimeout(hide, reduced ? 200 : 700);
    window.addEventListener("load", hide, { once: true });

    // Safety: never let the splash persist beyond 3.5s no matter what.
    const maxTime = window.setTimeout(hide, 3500);

    return () => {
      window.clearTimeout(minTime);
      window.clearTimeout(maxTime);
      window.removeEventListener("load", hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-emerald-dark via-teal-dark to-teal"
      style={{ transition: "opacity 0.5s ease" }}
      aria-hidden="true"
    >
      <div className="relative">
        <img
          src="/icons/icon-512.png"
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-[28px] shadow-teal"
        />
        <div className="absolute -inset-3 rounded-[32px] border-2 border-white/20 animate-pulse" />
      </div>

      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-white">
        InternIQ
      </h1>
      <p className="mt-1 text-xs font-mono text-white/70">
        AI-Powered Internship Platform
      </p>

      <div className="mt-8 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
        <span
          className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
      <p className="mt-3 text-[11px] text-white/60 font-mono">
        Preparing your AI workspace...
      </p>
    </div>
  );
}
