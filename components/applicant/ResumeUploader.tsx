"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UploadCloud, FileText, Trash2, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ResumeUploader({ currentCvPath, userId }: { currentCvPath: string | null, userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [cvPath, setCvPath] = useState(currentCvPath);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      return toast.error("Only PDF files are allowed");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size should be less than 5MB");
    }

    setUploading(true);
    try {
      const filePath = `applicant-resumes/${userId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage.from("cvs").upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { error: updateError } = await supabase.from("applicant_profiles").update({ cv_path: filePath }).eq("id", userId);
      if (updateError) throw updateError;
      
      setCvPath(filePath);
      toast.success("Resume uploaded successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!cvPath) return;
    
    try {
      await supabase.storage.from("cvs").remove([cvPath]);
      await supabase.from("applicant_profiles").update({ cv_path: null }).eq("id", userId);
      setCvPath(null);
      toast.success("Resume deleted");
    } catch (e: any) {
      toast.error("Failed to delete resume");
    }
  };

  const cvUrl = cvPath ? supabase.storage.from("cvs").getPublicUrl(cvPath).data.publicUrl : null;

  let fileName = "";
  let uploadDate = "";
  
  if (cvPath) {
    const parts = cvPath.split("/");
    const filenameWithTimestamp = parts[parts.length - 1];
    const match = filenameWithTimestamp.match(/^(\d+)_(.+)$/);
    if (match) {
      uploadDate = new Date(parseInt(match[1])).toLocaleDateString();
      fileName = match[2];
    } else {
      fileName = filenameWithTimestamp;
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-card border border-border">
      <h2 className="text-xl font-display font-bold text-primary mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-teal" /> Your Resume
      </h2>

      {!cvPath ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:bg-slate-50 transition-colors">
          <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-primary text-lg mb-2">Upload your resume</h3>
          <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
            Upload your latest resume in PDF format. Max file size: 5MB.
          </p>
          <div className="relative inline-block">
            <Button variant="gradient" disabled={uploading}>
              {uploading ? "Uploading..." : "Select File"}
            </Button>
            <input 
              type="file" 
              accept=".pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-2xl gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
                <FileText className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-emerald-900 flex items-center gap-2 text-lg">
                  Resume Active <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </h3>
                {fileName && <p className="text-sm font-medium text-emerald-800 mt-1 truncate">{fileName}</p>}
                <p className="text-xs text-emerald-700 mt-0.5">Uploaded on {uploadDate}</p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <a href={cvUrl || "#"} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </a>
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-rose-500 border-rose-200 bg-white hover:bg-rose-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="w-full h-[600px] border border-border rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
            {cvUrl ? (
              <iframe src={`${cvUrl}#toolbar=0`} className="w-full h-full" title="Resume Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Loading preview...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
