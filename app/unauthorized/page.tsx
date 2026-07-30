"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
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
            <rect x="30" y="30" width="100" height="80" rx="12" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2"/>
            <rect x="45" y="45" width="70" height="8" rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1"/>
            <rect x="45" y="60" width="55" height="6" rx="3" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1"/>
            <rect x="45" y="74" width="60" height="6" rx="3" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1"/>
            <circle cx="80" cy="100" r="20" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
            <path d="M74 96 L80 102 L86 96" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="18" cy="25" r="6" fill="#EF4444" opacity="0.2"/>
            <circle cx="145" cy="30" r="4" fill="#EF4444" opacity="0.15"/>
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
              <ShieldAlert className="h-3.5 w-3.5" />
              403 Forbidden
            </span>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-primary dark:text-white">
            Access Denied
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            You don&apos;t have permission to access this page. 
            Please contact your administrator or log in with an authorized account.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-5 py-3 text-sm font-semibold shadow-teal hover:opacity-95 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Link>
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
