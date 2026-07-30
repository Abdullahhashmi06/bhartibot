"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Briefcase, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ExperienceEditor({ experience: initialExperience }: { experience: any[] }) {
  const [experience, setExperience] = useState(initialExperience);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ company: "", role: "", type: "internship", start_date: "", end_date: "", description: "" });
  const supabase = createClient();

  const handleEdit = (exp: any) => {
    setEditingId(exp.id);
    setFormData({
      company: exp.company,
      role: exp.role,
      type: exp.type || "internship",
      start_date: exp.start_date || "",
      end_date: exp.end_date || "",
      description: exp.description || ""
    });
  };

  const handleSave = async () => {
    if (!formData.company || !formData.role) return toast.error("Company and Role are required");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const payload = {
        applicant_id: user.id,
        ...formData
      };

      if (editingId) {
        const { data, error } = await supabase.from("applicant_experience").update(payload).eq("id", editingId).select().single();
        if (error) throw error;
        setExperience(experience.map(e => e.id === editingId ? data : e));
        setEditingId(null);
      } else {
        const { data, error } = await supabase.from("applicant_experience").insert(payload).select().single();
        if (error) throw error;
        setExperience([...experience, data]);
        setIsAdding(false);
      }
      toast.success("Experience saved!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("applicant_experience").delete().eq("id", id);
      if (error) throw error;
      setExperience(experience.filter(e => e.id !== id));
      toast.success("Experience deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary">Experience</h2>
        </div>
        {!isAdding && !editingId && (
          <button onClick={() => { setIsAdding(true); setFormData({ company: "", role: "", type: "internship", start_date: "", end_date: "", description: "" }); }} className="p-2 text-teal hover:bg-teal/10 rounded-full transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="mb-6 p-4 border border-border rounded-2xl bg-slate-50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">Role / Title *</label>
              <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="Software Engineering Intern" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Company *</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="Google" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white">
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Start Date</label>
              <input type="text" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="May 2023" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">End Date</label>
              <input type="text" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="Aug 2023 / Present" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" rows={4} placeholder="Describe your responsibilities and achievements..." />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
            <Button variant="gradient" onClick={handleSave}>Save Experience</Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {experience.map((exp) => (
          <div key={exp.id} className="group relative border-b border-border last:border-0 pb-6 last:pb-0">
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button onClick={() => handleEdit(exp)} className="p-1.5 text-text-muted hover:text-teal rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
            
            <h3 className="font-semibold text-primary text-lg">{exp.role}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-text-secondary">{exp.company}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{exp.type}</span>
            </div>
            
            <p className="text-xs text-text-muted mt-2">
              {exp.start_date} {exp.end_date && `- ${exp.end_date}`}
            </p>
            
            {exp.description && <p className="text-sm text-text-secondary mt-3 whitespace-pre-line">{exp.description}</p>}
          </div>
        ))}
        {experience.length === 0 && !isAdding && (
          <p className="text-text-muted text-sm italic">Add your work or internship experience.</p>
        )}
      </div>
    </div>
  );
}
