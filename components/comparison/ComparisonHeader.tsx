"use client"
import { Application, CandidateAiAnalysis } from "@/lib/types";
import { getAvatarUrl } from "@/lib/utils";
import { Trophy, Sparkles, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";
import Tag from "@/components/ui/Tag";

interface Props {
  candidates: Application[];
  analyses: Record<string, CandidateAiAnalysis | null>;
}

export default function ComparisonHeader({ candidates, analyses }: Props) {
  // Find winner by highest match score
  let winnerId: string | null = null;
  let maxScore = -1;
  let runnerUpId: string | null = null;
  let runnerUpScore = -1;
  
  candidates.forEach(c => {
    const score = analyses[c.id]?.match_score || 0;
    if (score > maxScore) {
      runnerUpId = winnerId;
      runnerUpScore = maxScore;
      maxScore = score;
      winnerId = c.id;
    } else if (score > runnerUpScore) {
      runnerUpId = c.id;
      runnerUpScore = score;
    }
  });

  const winnerCandidate = winnerId ? candidates.find(c => c.id === winnerId) : null;
  const winnerAnalysis = winnerId ? analyses[winnerId] : null;
  const winnerReasoning = winnerAnalysis?.reasoning || winnerAnalysis?.parsed_resume?.summary || "Strongest candidate based on AI analysis.";

  return (
    <div className="w-full">
      {/* Winner Banner - Premium */}
      {winnerId && maxScore > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-r from-[#17C6B5] via-[#6F52ED] to-[#17C6B5] rounded-2xl p-[2px] mb-8 shadow-card"
        >
          <div className="bg-white/95 backdrop-blur rounded-[14px] p-6 md:p-8 dark:bg-[#0F1729]/90 dark:backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Trophy + Name */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-gradient-to-br from-amber-400 to-amber-500 p-3.5 rounded-2xl shadow-lg shadow-amber-200/50 dark:shadow-amber-500/25"
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-purple-ai">
                      Best Overall Candidate
                    </span>
                    <span className="bg-teal/10 text-teal-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal/30">
                      AI Recommended
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl md:text-3xl font-display font-extrabold text-primary">
                      {winnerCandidate?.applicant_name}
                    </h2>
                    <Tag tone="teal" className="text-sm px-3 py-1">
                      {maxScore}% Match
                    </Tag>
                    {winnerAnalysis?.recommendation && (
                      <Tag tone={
                        winnerAnalysis.recommendation.toLowerCase().includes("hire") ? "teal" :
                        winnerAnalysis.recommendation.toLowerCase().includes("interview") ? "purple" :
                        winnerAnalysis.recommendation.toLowerCase().includes("maybe") ? "amber" : "rose"
                      } className="text-sm">
                        {winnerAnalysis.recommendation}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Score margin indicator */}
              {runnerUpId && maxScore > runnerUpScore && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald/20 ml-auto shrink-0 dark:bg-emerald/10 dark:border-emerald-400/25">
                  <TrendingUp className="w-4 h-4 text-emerald" />
                  <span className="text-xs font-bold text-emerald">
                    +{maxScore - runnerUpScore}% ahead of runner-up
                  </span>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-ai mt-0.5 shrink-0" />
                <p className="text-sm text-text-secondary leading-relaxed italic">
                  &ldquo;{winnerReasoning}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Candidates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
        <div className="hidden md:flex flex-col justify-center items-start">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Candidates
          </span>
          <p className="text-xs text-text-secondary mt-1">
            {candidates.length} selected for comparison
          </p>
        </div>
        {candidates.map((c, i) => {
          const isWinner = winnerId === c.id;
          const score = analyses[c.id]?.match_score || 0;
          
          return (
            <motion.div 
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`relative flex flex-col items-center text-center p-4 md:p-6 rounded-2xl border transition-all ${
                isWinner 
                  ? 'border-teal bg-gradient-to-b from-teal-light/30 to-white shadow-teal/20 shadow-md dark:border-teal/40 dark:from-teal/15 dark:to-[#1A2438] dark:shadow-teal/10' 
                  : 'border-border bg-white shadow-sm hover:shadow-md hover:border-slate-300 dark:bg-[#1A2438] dark:hover:border-slate-600'
              }`}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-2.5 -right-2.5 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-[10px] md:text-xs font-extrabold shadow-sm border-2 border-white ${
                isWinner 
                  ? 'bg-gradient-primary text-white' 
                  : 'bg-slate-100 text-text-muted dark:bg-slate-700 dark:border-slate-700'
              }`}>
                {i + 1}
              </div>

              {isWinner && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-white text-[9px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-sm whitespace-nowrap flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Top Pick
                </div>
              )}
              
              <img 
                src={getAvatarUrl(c.email)} 
                alt={c.applicant_name}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 mb-2 md:mb-3 ${isWinner ? 'border-teal shadow-teal' : 'border-white shadow-md dark:border-slate-600'} bg-teal-light dark:bg-slate-700`}
              />
              
              <h3 className="font-display font-semibold text-xs md:text-sm text-primary truncate w-full max-w-[100px] md:max-w-full" title={c.applicant_name}>
                {c.applicant_name}
              </h3>
              
              <p className="text-[10px] md:text-xs text-text-muted truncate w-full max-w-[100px] md:max-w-full" title={c.university || ""}>
                {c.university || "N/A"}
              </p>
              
              <div className="mt-2 md:mt-4">
                <span className={`text-lg md:text-2xl font-bold font-mono ${
                  isWinner ? 'text-teal' : score >= 80 ? 'text-emerald' : score >= 60 ? 'text-purple-ai' : 'text-text-secondary'
                }`}>
                  {score}%
                </span>
              </div>

              {analyses[c.id]?.recommendation && (
                <div className="mt-1.5">
                  <Tag tone={
                    analyses[c.id]!.recommendation!.toLowerCase().includes("hire") ? "teal" :
                    analyses[c.id]!.recommendation!.toLowerCase().includes("interview") ? "purple" :
                    analyses[c.id]!.recommendation!.toLowerCase().includes("maybe") ? "amber" : "rose"
                  } className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5">
                    {analyses[c.id]!.recommendation!}
                  </Tag>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
