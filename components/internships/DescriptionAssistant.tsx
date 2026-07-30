"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import EditableSuggestion from "@/components/internships/EditableSuggestion";
import type { DescriptionSuggestion } from "@/lib/ai/assistant";

async function callDescriptionAssistant(opts: {
  title: string;
  field: string;
  location: string;
  workMode: string;
  duration: string;
  existingDescription: string;
}): Promise<DescriptionSuggestion> {
  const res = await fetch("/api/ai/description-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function DescriptionAssistant({
  title,
  field,
  location,
  workMode,
  duration,
  existingDescription,
  onAcceptDescription,
}: {
  title: string;
  field: string;
  location: string;
  workMode: string;
  duration: string;
  existingDescription: string;
  onAcceptDescription: (desc: string) => void;
}) {
  const [suggestion, setSuggestion] = useState<DescriptionSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function handleGenerate() {
    if (!title.trim()) {
      setError("Enter a role title first.");
      return;
    }
    setLoading(true);
    setError(null);
    setDismissed(false);

    try {
      const data = await callDescriptionAssistant({
        title: title.trim(),
        field,
        location,
        workMode,
        duration,
        existingDescription,
      });
      setSuggestion(data);
    } catch {
      setError("AI suggestion failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!suggestion) return;
    onAcceptDescription(suggestion.description);
    setDismissed(true);
  }

  function handleEdit() {
    if (!suggestion) return;
    onAcceptDescription(suggestion.description);
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          isLoading={loading}
          leftIcon={<Sparkles className="h-3.5 w-3.5 text-purple-ai" />}
          className="text-purple-ai border-purple-ai/30 hover:bg-purple-light"
        >
          ✨ AI Suggestions
        </Button>
        {suggestion && (
          <span className="text-[10px] text-text-muted font-mono">
            {suggestion.responsibilities.length} responsibilities · {suggestion.learning_outcomes.length} outcomes
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <AnimatePresence>
        {suggestion && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-4"
          >
            <EditableSuggestion
              onAccept={handleAccept}
              onEdit={handleEdit}
              onIgnore={() => setDismissed(true)}
              confidence="high"
            >
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-1">AI Suggested Description</p>
                  <p className="text-text-secondary text-xs">{suggestion.description}</p>
                </div>

                {suggestion.responsibilities.length > 0 && (
                  <div>
                    <p className="font-semibold text-xs text-text-primary mb-1">Key Responsibilities</p>
                    <ul className="list-disc pl-4 text-xs text-text-secondary space-y-0.5">
                      {suggestion.responsibilities.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestion.learning_outcomes.length > 0 && (
                  <div>
                    <p className="font-semibold text-xs text-text-primary mb-1">Learning Outcomes</p>
                    <ul className="list-disc pl-4 text-xs text-text-secondary space-y-0.5">
                      {suggestion.learning_outcomes.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </EditableSuggestion>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
