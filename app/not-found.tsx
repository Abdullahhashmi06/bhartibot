"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
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
          <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="40" width="120" height="85" rx="12" fill="#E8FAF8" stroke="#17C6B5" strokeWidth="2"/>
            <rect x="45" y="30" width="90" height="20" rx="6" fill="#0B1F3A"/>
            <rect x="60" y="20" width="60" height="15" rx="5" fill="#6F52ED" opacity="0.6"/>
            <text x="90" y="38" textAnchor="middle" fill="white" fontSize="14" fontFamily="monospace" fontWeight="bold">404</text>
            <path d="M55 70 L90 90 L125 70" stroke="#17C6B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="90" cy="72" r="8" fill="#6F52ED" opacity="0.3" stroke="#6F52ED" strokeWidth="2"/>
            <path d="M86 72 L90 76 L98 68" stroke="#6F52ED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Question marks */}
            <text x="30" y="15" fill="#CBD5E1" fontSize="20" fontFamily="monospace" fontWeight="bold">?</text>
            <text x="145" y="25" fill="#CBD5E1" fontSize="24" fontFamily="monospace" fontWeight="bold">?</text>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="font-display font-extrabold text-4xl text-primary dark:text-white">
            Page Not Found
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Let&apos;s get you back on track.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-white px-5 py-3 text-sm font-semibold shadow-teal hover:opacity-95 transition-all"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    </div>
  );
}
