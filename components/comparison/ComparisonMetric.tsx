"use client"
import { motion } from "framer-motion";

interface Props {
  label: string;
  values: { candidateId: string; value: string | number | null }[];
  highlight?: boolean;
}

export default function ComparisonMetric({ label, values, highlight = false }: Props) {
  let maxVal = -Infinity;
  let minVal = Infinity;

  if (highlight) {
    values.forEach(v => {
      const num = Number(v.value);
      if (!isNaN(num) && v.value !== null) {
        if (num > maxVal) maxVal = num;
        if (num < minVal) minVal = num;
      }
    });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 border-b border-border/50 hover:bg-background/50 transition-colors"
    >
      <div className="font-medium text-text-secondary flex items-center md:pl-2">
        {label}
      </div>
      {values.map((v) => {
        const numVal = Number(v.value);
        const isMax = highlight && !isNaN(numVal) && numVal === maxVal && maxVal !== minVal;
        const isMin = highlight && !isNaN(numVal) && numVal === minVal && maxVal !== minVal;
        
        return (
          <div key={v.candidateId} className="flex flex-col justify-center">
            <span className="md:hidden text-xs text-text-muted mb-1 uppercase tracking-wider">{label}</span>
            <div className={`
              inline-block px-3 py-2 rounded-lg text-sm font-medium
              ${isMax ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : ''}
              ${isMin ? 'bg-rose-50 text-rose-700 border border-rose-200' : ''}
              ${!isMax && !isMin ? 'text-primary' : ''}
            `}>
              {v.value !== null && v.value !== undefined && v.value !== "" ? v.value : "—"}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
