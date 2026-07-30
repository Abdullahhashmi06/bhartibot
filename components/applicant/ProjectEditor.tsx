"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { FolderGit2, Plus, Edit2, Trash2, Check, X, Github, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProjectEditor({ projects: initialProjects }: { projects: any[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", tech_stack: "", github_url: "", live_url: "" });
  const supabase = createClient();

  const handleEdit = (proj: any) => {
    setEditingId(proj.id);
    setFormData({
      title: proj.title,
      description: proj.description || "",
      tech_stack: proj.tech_stack?.join(", ") || "",
      github_url: proj.github_url || "",
      live_url: proj.live_url || ""
    });
  };

  const handleSave = async () => {
    if (!formData.title) return toast.error("Title is required");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const payload = {
        applicant_id: user.id,
        title: formData.title,
        description: formData.description,
        tech_stack: formData.tech_stack.split(",").map(s => s.trim()).filter(Boolean),
        github_url: formData.github_url,
        live_url: formData.live_url
      };

      if (editingId) {
        const { data, error } = await supabase.from("applicant_projects").update(payload).eq("id", editingId).select().single();
        if (error) throw error;
        setProjects(projects.map(p => p.id === editingId ? data : p));
        setEditingId(null);
      } else {
        const { data, error } = await supabase.from("applicant_projects").insert(payload).select().single();
        if (error) throw error;
        setProjects([...projects, data]);
        setIsAdding(false);
      }
      toast.success("Project saved!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("applicant_projects").delete().eq("id", id);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
      toast.success("Project deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary">Projects</h2>
        </div>
        {!isAdding && !editingId && (
          <button onClick={() => { setIsAdding(true); setFormData({ title: "", description: "", tech_stack: "", github_url: "", live_url: "" }); }} className="p-2 text-teal hover:bg-teal/10 rounded-full transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="mb-6 p-4 border border-border rounded-2xl bg-slate-50 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary">Project Title *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="e.g. E-Commerce Platform" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" rows={3} placeholder="What did you build?" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary">Tech Stack (comma separated)</label>
            <input type="text" value={formData.tech_stack} onChange={e => setFormData({...formData, tech_stack: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="React, Node.js, MongoDB" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">GitHub URL</label>
              <input type="url" value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Live URL</label>
              <input type="url" value={formData.live_url} onChange={e => setFormData({...formData, live_url: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-white" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
            <Button variant="gradient" onClick={handleSave}>Save Project</Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {projects.map((proj) => (
          <div key={proj.id} className="group relative border-b border-border last:border-0 pb-6 last:pb-0">
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button onClick={() => handleEdit(proj)} className="p-1.5 text-text-muted hover:text-teal rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(proj.id)} className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
            
            <h3 className="font-semibold text-primary text-lg flex items-center gap-2">
              {proj.title}
              {proj.github_url && <a href={proj.github_url} target="_blank" className="text-slate-400 hover:text-slate-900"><Github className="w-4 h-4" /></a>}
              {proj.live_url && <a href={proj.live_url} target="_blank" className="text-slate-400 hover:text-teal"><LinkIcon className="w-4 h-4" /></a>}
            </h3>
            
            {proj.tech_stack && proj.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {proj.tech_stack.map((tech: string, i: number) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{tech}</span>
                ))}
              </div>
            )}
            
            {proj.description && <p className="text-sm text-text-secondary mt-3 whitespace-pre-line">{proj.description}</p>}
          </div>
        ))}
        {projects.length === 0 && !isAdding && (
          <p className="text-text-muted text-sm italic">Add projects you&apos;ve worked on.</p>
        )}
      </div>
    </div>
  );
}
