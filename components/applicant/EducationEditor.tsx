"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Edit2, Check, X, AlertTriangle } from "lucide-react";
import { isValidCgpa } from "@/lib/utils";

export default function EducationEditor({ profile }: { profile: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cgpaError, setCgpaError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    university: profile?.university || "",
    degree: profile?.degree || "",
    semester: profile?.semester || "",
    cgpa: profile?.cgpa || "",
  });
  const supabase = createClient();

  function handleCgpaChange(value: string) {
    setFormData((prev) => ({ ...prev, cgpa: value }));
    if (value.trim() === "") {
      setCgpaError(null);
    } else if (!isValidCgpa(value)) {
      setCgpaError("Enter CGPA from 0–4, or N/A if not applicable.");
    } else {
      setCgpaError(null);
    }
  }

  const handleSave = async () => {
    if (cgpaError) {
      toast.error(cgpaError);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from("applicant_profiles").update({
        ...formData,
        cgpa: formData.cgpa.trim().toUpperCase() === "N/A" ? "N/A" : formData.cgpa.trim(),
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Education updated!");
      setCgpaError(null);
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary">Education</h2>
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
          <div>
            <label className="text-xs font-medium text-text-secondary">University / Institution</label>
            <input type="text" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="e.g. Stanford University" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary">Degree & Major</label>
            <input type="text" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="e.g. B.S. Computer Science" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">Current Semester/Year</label>
              <input type="text" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" placeholder="e.g. 6th Semester or N/A" />
              <p className="text-[10px] text-text-muted mt-1">Enter N/A if not applicable.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">CGPA</label>
              <input
                type="text"
                value={formData.cgpa}
                onChange={e => handleCgpaChange(e.target.value)}
                className={`w-full mt-1 p-2 border rounded-lg text-sm ${cgpaError ? "border-danger" : "border-border"}`}
                placeholder="3.8 or N/A"
              />
              {cgpaError ? (
                <p className="flex items-center gap-1 text-[10px] text-danger font-medium mt-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> {cgpaError}
                </p>
              ) : (
                <p className="text-[10px] text-text-muted mt-1">Enter CGPA from 0–4, or N/A.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.university ? (
            <div>
              <h3 className="font-semibold text-primary text-lg">{formData.university}</h3>
              <p className="text-text-secondary">{formData.degree}</p>
              <div className="flex gap-4 mt-2 text-sm text-text-muted">
                {formData.semester && <span>Semester: {formData.semester}</span>}
                {formData.cgpa && <span>CGPA: {formData.cgpa}</span>}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm italic">No education details added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
