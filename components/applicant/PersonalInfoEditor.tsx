"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Edit2, Check, X } from "lucide-react";

export default function PersonalInfoEditor({ profile }: { profile: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    portfolio_url: profile?.portfolio_url || "",
  });
  const supabase = createClient();

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from("applicant_profiles").update(formData).eq("id", user.id);
      if (error) throw error;
      toast.success("Personal information updated!");
      setIsEditing(false);
      // Let's force a refresh to update the header as well
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal/10 text-teal rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary">Personal Information</h2>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="p-2 text-text-muted hover:text-teal transition-colors rounded-full hover:bg-teal/10">
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check className="w-4 h-4" /></button>
            <button onClick={() => setIsEditing(false)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">Full Name</label>
              <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Location</label>
              <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="City, Country" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary">Bio</label>
            <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" rows={3} placeholder="A short bio about yourself..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">LinkedIn URL</label>
              <input type="url" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">GitHub URL</label>
              <input type="url" value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Portfolio URL</label>
              <input type="url" value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="https://..." />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Edit your personal information here. This will be visible on your profile header above.</p>
        </div>
      )}
    </div>
  );
}
