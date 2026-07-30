"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Tag";

interface SkillsCloudProps {
  skills: { skill: string; count: number }[];
}

export default function SkillsCloud({ skills }: SkillsCloudProps) {
  // If no skills, provide placeholder
  const displaySkills = skills.length > 0 ? skills : [
    { skill: "React", count: 24 },
    { skill: "TypeScript", count: 22 },
    { skill: "Python", count: 18 },
    { skill: "Machine Learning", count: 15 },
    { skill: "Node.js", count: 14 },
    { skill: "SQL", count: 12 },
    { skill: "Docker", count: 10 },
    { skill: "AWS", count: 8 },
    { skill: "Figma", count: 6 },
  ];

  const maxCount = Math.max(...displaySkills.map(s => s.count));

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 }
  };

  const tones: Array<"teal" | "amber" | "rose" | "purple" | "emerald" | "info" | "neutral"> = 
    ["teal", "purple", "emerald", "info", "amber"];

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-primary">
          Most Required Skills
        </h3>
        <p className="text-xs text-text-secondary">
          Frequency across all internship requirements.
        </p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-2 pt-2"
      >
        {displaySkills.map((skill, idx) => {
          const ratio = skill.count / maxCount;
          // Scale size slightly based on frequency
          const scale = 0.8 + (ratio * 0.4); // 0.8 to 1.2
          
          return (
            <motion.div 
              key={idx} 
              variants={item}
              style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
            >
              <Badge 
                variant={tones[idx % tones.length]} 
                className="transition-transform hover:scale-105 cursor-default"
              >
                {skill.skill} <span className="opacity-60 ml-1.5 text-[0.8em]">({skill.count})</span>
              </Badge>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
