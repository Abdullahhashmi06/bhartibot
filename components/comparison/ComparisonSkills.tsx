"use client"
import { motion } from "framer-motion";
import Tag from "@/components/ui/Tag";

interface Props {
  label: string;
  type: "matched" | "missing";
  values: { candidateId: string; skills: string[] }[];
}

export default function ComparisonSkills({ label, type, values }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-5 gap-4 py-6 border-b border-border/50 hover:bg-background/50 transition-colors"
    >
      <div className="font-medium text-text-secondary md:pl-2 pt-2">
        {label}
      </div>
      {values.map((v) => (
        <div key={v.candidateId} className="flex flex-col">
          <span className="md:hidden text-xs text-text-muted mb-2 uppercase tracking-wider">{label}</span>
          <div className="flex flex-wrap gap-2">
            {v.skills && v.skills.length > 0 ? (
              v.skills.map((skill, idx) => (
                <Tag key={idx} tone={type === "matched" ? "teal" : "rose"}>
                  {skill}
                </Tag>
              ))
            ) : (
              <span className="text-sm text-text-muted italic">None detected</span>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
