"use client";

import { useState } from "react";
import { Download, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";

interface PdfViewerProps {
  url: string;
  filename: string;
}

export default function PdfViewer({ url, filename }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-primary/95 backdrop-blur-sm flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-primary-dark">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md">
              PDF
            </span>
            <span className="font-display font-semibold text-sm text-slate-200 truncate">
              {filename}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={url}
              download={filename}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <button
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-dark transition-colors"
            >
              <Minimize2 className="h-3.5 w-3.5" /> Close
            </button>
          </div>
        </div>
        <div className="flex-1 w-full bg-slate-900/50 p-4 sm:p-8 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white">
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-none"
              title={filename}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-slate-50/50 overflow-hidden shadow-subtle flex flex-col h-[500px] sm:h-[600px] transition-all">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white">
        <span className="text-xs font-semibold text-text-secondary truncate">
          {filename}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download={filename}
            className="rounded-lg p-1.5 text-text-muted hover:text-teal hover:bg-teal-light transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={() => setIsFullscreen(true)}
            className="rounded-lg p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 transition-colors"
            title="Fullscreen Mode"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-slate-200/50">
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          className="w-full h-full border-none"
          title={filename}
        />
      </div>
    </div>
  );
}
