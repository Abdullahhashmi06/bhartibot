"use client";

import { getAvatarUrl } from "@/lib/utils";
import Image from "next/image";
import AnimatedCounter from "./AnimatedCounter";

interface TopUniversitiesProps {
  universities: {
    university: string;
    applicants: number;
    avgScore: number;
  }[];
}

export default function TopUniversities({ universities }: TopUniversitiesProps) {
  // If no real data, provide placeholders
  const displayData = universities.length > 0 ? universities : [
    { university: "Stanford University", applicants: 45, avgScore: 92 },
    { university: "MIT", applicants: 38, avgScore: 89 },
    { university: "UC Berkeley", applicants: 32, avgScore: 86 },
    { university: "Carnegie Mellon", applicants: 28, avgScore: 88 },
    { university: "Cornell University", applicants: 20, avgScore: 82 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-primary">
          Top Universities
        </h3>
        <p className="text-xs text-text-secondary">
          Highest performing applicant pools.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {displayData.map((uni, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="font-mono text-xs font-bold text-text-muted w-4 text-center">
              {idx + 1}
            </div>
            <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
              <Image src={getAvatarUrl(uni.university)} alt={uni.university} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-primary truncate pr-2">
                  {uni.university}
                </span>
                <span className="text-xs font-semibold text-text-primary shrink-0">
                  <AnimatedCounter value={uni.avgScore} />%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full" 
                    style={{ width: `${uni.avgScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-secondary font-medium w-16 text-right">
                  {uni.applicants} applicants
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
