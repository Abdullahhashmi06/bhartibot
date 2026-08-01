"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Code, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SkillEditor({ skills: initialSkills }: { skills: any[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [newSkill, setNewSkill] = useState("");
  const supabase = createClient();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase.from("applicant_skills").insert({
        applicant_id: user.id,
        skill: newSkill.trim()
      }).select().single();
      
      if (error) throw error;
      setSkills([...skills, data]);
      setNewSkill("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from("applicant_skills").delete().eq("id", id);
      if (error) throw error;
      setSkills(skills.filter(s => s.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-light text-teal-dark dark:bg-teal/15 dark:text-teal rounded-xl">
          <Code className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-display font-bold text-primary dark:text-white">Skills</h2>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newSkill} 
          onChange={e => setNewSkill(e.target.value)} 
          className="flex-1 p-2 border border-border rounded-xl text-sm outline-none focus:border-teal dark:bg-slate-700 dark:text-white dark:border-slate-600"
          placeholder="e.g. React, Python"
        />
        <button type="submit" className="p-2 bg-gradient-to-r from-emerald-dark to-teal text-white rounded-xl hover:opacity-95 transition-opacity">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map((s) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key={s.id} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-light/70 dark:bg-teal/15 text-teal-dark dark:text-teal rounded-lg text-sm font-medium border border-teal/20"
            >
              {s.skill}
              <button onClick={() => handleRemove(s.id)} className="text-teal/60 hover:text-teal-dark dark:hover:text-teal-light focus:outline-none">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
          {skills.length === 0 && (
            <p className="text-text-muted text-sm w-full italic">Add your technical skills, tools, and soft skills.</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
