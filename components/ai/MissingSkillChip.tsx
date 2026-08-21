"use client";

import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissingSkillChipProps {
  skills: string[];
  className?: string;
}

export function MissingSkillChip({ skills, className }: MissingSkillChipProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
        <XCircle className="h-3.5 w-3.5 text-danger" /> Missing Skills ({skills.length})
      </span>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-red-50 text-danger border border-red-200 font-mono text-xs font-semibold shadow-subtle dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-rose-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
