"use client";

import { useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import EditableSuggestion from "@/components/internships/EditableSuggestion";
import type { RequirementReview } from "@/lib/ai/assistant";

async function callRequirementReview(opts: {
  title: string;
  field: string;
  description: string;
  currentRequired: string[];
  currentPreferred: string[];
}): Promise<RequirementReview> {
  const res = await fetch("/api/ai/requirement-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function RequirementReviewPanel({
  title,
  field,
  description,
  required,
  preferred,
  onAddRequired,
  onAddPreferred,
}: {
  title: string;
  field: string;
  description: string;
  required: string[];
  preferred: string[];
  onAddRequired: (skill: string) => void;
  onAddPreferred: (skill: string) => void;
}) {
  const [review, setReview] = useState<RequirementReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());

  async function handleReview() {
    if (!title.trim()) {
      setError("Enter a role title first.");
      return;
    }
    setLoading(true);
    setError(null);
    setDismissed(false);

    try {
      const data = await callRequirementReview({
        title: title.trim(),
        field,
        description,
        currentRequired: required,
        currentPreferred: preferred,
      });
      setReview(data);
    } catch {
      setError("AI review failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAddRequired(skill: string) {
    if (addedSkills.has(skill)) return;
    onAddRequired(skill);
    setAddedSkills((prev) => new Set(prev).add(skill));
  }

  function handleAddPreferred(skill: string) {
    if (addedSkills.has(skill)) return;
    onAddPreferred(skill);
    setAddedSkills((prev) => new Set(prev).add(skill));
  }

  if (dismissed) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReview}
          isLoading={loading}
          leftIcon={<Sparkles className="h-3.5 w-3.5 text-purple-ai" />}
          className="text-purple-ai border-purple-ai/30 hover:bg-purple-light"
        >
          ✨ Review Requirements
        </Button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <AnimatePresence>
        {review && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-4"
          >
            {/* Suggested Required Skills */}
            {review.suggested_required.length > 0 && (
              <EditableSuggestion
                onAccept={() => {
                  review.suggested_required.forEach((s) => handleAddRequired(s));
                }}
                onIgnore={() => {}}
                onEdit={() => {}}
                confidence="high"
                showLabel={false}
              >
                <div className="space-y-2">
                  <p className="font-display font-bold text-xs text-amber">
                    Suggested Required Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {review.suggested_required.map((skill) => (
                      <span
                        key={skill}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          addedSkills.has(skill)
                            ? "border-teal bg-teal-light text-teal-dark opacity-60"
                            : "border-border bg-white text-text-primary hover:border-teal hover:bg-teal-light/50"
                        }`}
                      >
                        <span>{skill}</span>
                        {!addedSkills.has(skill) ? (
                          <button
                            type="button"
                            onClick={() => handleAddRequired(skill)}
                            className="hover:text-teal-dark transition-colors"
                            title="Add this requirement"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-teal-dark">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </EditableSuggestion>
            )}

            {/* Suggested Preferred Skills */}
            {review.suggested_preferred.length > 0 && (
              <EditableSuggestion
                onAccept={() => {
                  review.suggested_preferred.forEach((s) => handleAddPreferred(s));
                }}
                onIgnore={() => {}}
                onEdit={() => {}}
                confidence="medium"
                showLabel={false}
              >
                <div className="space-y-2">
                  <p className="font-display font-bold text-xs text-teal">
                    Suggested Preferred Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {review.suggested_preferred.map((skill) => (
                      <span
                        key={skill}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          addedSkills.has(skill)
                            ? "border-teal bg-teal-light text-teal-dark opacity-60"
                            : "border-border bg-white text-text-primary hover:border-teal hover:bg-teal-light/50"
                        }`}
                      >
                        <span>{skill}</span>
                        {!addedSkills.has(skill) ? (
                          <button
                            type="button"
                            onClick={() => handleAddPreferred(skill)}
                            className="hover:text-teal-dark transition-colors"
                            title="Add this requirement"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-teal-dark">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </EditableSuggestion>
            )}

            {/* Missing Requirements */}
            {review.missing_requirements.length > 0 && (
              <EditableSuggestion
                onAccept={() => {
                  review.missing_requirements.forEach((s) => handleAddRequired(s));
                }}
                onIgnore={() => {}}
                onEdit={() => {}}
                confidence="medium"
                showLabel={true}
              >
                <div className="space-y-2">
                  <p className="font-display font-bold text-xs text-warning">
                    Potential Missing Requirements
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {review.missing_requirements.map((m) => (
                      <span
                        key={m}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                          addedSkills.has(m)
                            ? "border-teal bg-teal-light text-teal-dark opacity-60"
                            : "border-warning/30 bg-amber-50 text-text-primary hover:border-teal hover:bg-teal-light/50"
                        }`}
                      >
                        <span>• {m}</span>
                        {!addedSkills.has(m) ? (
                          <button
                            type="button"
                            onClick={() => handleAddRequired(m)}
                            className="hover:text-teal-dark transition-colors"
                            title="Add this requirement"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-teal-dark">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </EditableSuggestion>
            )}

            {/* Explanation */}
            {review.explanation && (
              <p className="text-[10px] text-text-muted italic border-t border-border pt-2">
                {review.explanation}
              </p>
            )}

            {/* Dismiss all */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-[10px] text-text-muted hover:text-text-primary underline transition-colors"
              >
                Dismiss all suggestions
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
