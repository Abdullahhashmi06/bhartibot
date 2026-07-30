"use client";

import { motion } from "framer-motion";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex justify-center"
        >
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="60" r="50" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2"/>
            <circle cx="80" cy="60" r="35" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5"/>
            <path d="M80 45 L80 65 M80 72 L80 74" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round"/>
            <rect x="50" y="100" width="60" height="8" rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5"/>
            <rect x="50" y="112" width="45" height="5" rx="2.5" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1"/>
            {/* Decorative dots */}
            <circle cx="25" cy="25" r="4" fill="#EF4444" opacity="0.3"/>
            <circle cx="140" cy="20" r="3" fill="#EF4444" opacity="0.2"/>
            <circle cx="145" cy="90" r="5" fill="#EF4444" opacity="0.25"/>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-danger px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              Error 500
            </span>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-primary dark:text-white">
            Something went wrong
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred. Our team has been notified. 
            Please try again or return to the dashboard.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-text-muted mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-5 py-3 text-sm font-semibold shadow-teal hover:opacity-95 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
