"use client"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  answersByCandidate: Record<string, {question: string, answer: string}[]>;
  candidateIds: string[];
}

export default function ComparisonAnswers({ answersByCandidate, candidateIds }: Props) {
  const uniqueQuestions = new Set<string>();
  Object.values(answersByCandidate).forEach(answers => {
    answers.forEach(a => uniqueQuestions.add(a.question));
  });

  const questions = Array.from(uniqueQuestions);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted">
        No screening answers found for these candidates.
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {questions.map((q, idx) => {
        const isExpanded = expandedIndex === idx;

        return (
          <div key={idx} className="border border-border rounded-xl bg-white shadow-sm overflow-hidden">
            <button 
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              className="w-full flex items-center justify-between p-4 bg-background/30 hover:bg-background/80 transition-colors text-left dark:bg-slate-800/40 dark:hover:bg-slate-700/50"
            >
              <h4 className="font-medium text-primary text-sm md:text-base pr-4">
                {q}
              </h4>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-text-muted flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" />
              )}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border"
                >
                  <div className="hidden md:block bg-background/20 dark:bg-slate-800/30">
                    {/* Empty spacer for alignment */}
                  </div>
                  {candidateIds.map(cid => {
                    const ans = answersByCandidate[cid]?.find(a => a.question === q);
                    return (
                      <div key={cid} className="p-4 bg-white">
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {ans?.answer ? ans.answer : <span className="italic text-text-muted">No answer provided</span>}
                        </p>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
