"use client";

import { useState } from "react";
import { Sparkles, Shield, CheckCircle2, AlertTriangle, Lightbulb, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { InternshipHealth } from "@/lib/ai/assistant";

async function callHealthAnalyzer(opts: {
  title: string;
  field: string;
  description: string;
  location: string;
  workMode: string;
  duration: string;
  requiredCount: number;
  preferredCount: number;
  questionCount: number;
}): Promise<InternshipHealth> {
  const res = await fetch("/api/ai/internship-health", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function QualityAnalyzer({
  title,
  field,
  description,
  location,
  workMode,
  duration,
  requiredCount,
  preferredCount,
  questionCount,
}: {
  title: string;
  field: string;
  description: string;
  location: string;
  workMode: string;
  duration: string;
  requiredCount: number;
  preferredCount: number;
  questionCount: number;
}) {
  const [health, setHealth] = useState<InternshipHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function handleAnalyze() {
    if (!title.trim()) {
      setError("Complete the role title first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const data = await callHealthAnalyzer({
        title: title.trim(),
        field,
        description,
        location,
        workMode,
        duration,
        requiredCount,
        preferredCount,
        questionCount,
      });
      setHealth(data);
      setDismissed(false);
    } catch {
      setError("Health analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (dismissed && !health) return null;

  return (
    <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-light text-purple-ai border border-purple-ai/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-primary">
              Internship Quality Analyzer ⭐
            </h2>
            <p className="text-xs text-text-secondary">
              AI reviews your posting and suggests improvements.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          isLoading={loading}
          leftIcon={health ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-purple-ai" />}
          className="text-purple-ai border-purple-ai/30 hover:bg-purple-light shrink-0"
        >
          {health ? "Re-analyze" : "Analyze Quality"}
        </Button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <AnimatePresence>
        {health && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Health Score */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="32" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke={health.health_score >= 80 ? "#17C6B5" : health.health_score >= 50 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="4"
                    strokeDasharray={`${(health.health_score / 100) * 201} 201`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`font-display font-extrabold text-xl ${
                      health.health_score >= 80
                        ? "text-teal-dark"
                        : health.health_score >= 50
                        ? "text-warning"
                        : "text-danger"
                    }`}
                  >
                    {health.health_score}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-display font-bold text-sm text-primary">Internship Health Score</p>
                <p className="text-xs text-text-secondary">
                  {health.health_score >= 80
                    ? "Strong posting — ready to publish!"
                    : health.health_score >= 50
                    ? "Decent but could use improvements."
                    : "Needs significant work before publishing."}
                </p>
              </div>
            </div>

            {/* Strengths */}
            {health.strengths.length > 0 && (
              <div className="space-y-2">
                <p className="font-display font-bold text-xs text-emerald flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                </p>
                <div className="space-y-1">
                  {health.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-text-primary">
                      <span className="text-emerald shrink-0">✓</span>
                      <span>{s.replace(/^[✓✅]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {health.weaknesses.length > 0 && (
              <div className="space-y-2">
                <p className="font-display font-bold text-xs text-warning flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Weaknesses
                </p>
                <div className="space-y-1">
                  {health.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-text-primary">
                      <span className="text-warning shrink-0">⚠</span>
                      <span>{w.replace(/^[⚠️]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {health.recommendations.length > 0 && (
              <div className="rounded-2xl bg-purple-light border border-purple-ai/20 p-4 space-y-2">
                <p className="font-display font-bold text-xs text-purple-ai flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Recommendations
                </p>
                <ul className="space-y-1">
                  {health.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-text-primary flex items-start gap-2">
                      <span className="text-purple-ai font-bold shrink-0">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {health && (
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-[10px] text-text-muted hover:text-text-primary underline transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
