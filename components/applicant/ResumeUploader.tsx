"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UploadCloud, FileText, Trash2, Download, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const CV_BUCKET = "cv-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (matches storage bucket limit)

export default function ResumeUploader({ currentCvPath, userId }: { currentCvPath: string | null, userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cvPath, setCvPath] = useState<string | null>(currentCvPath);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const supabase = createClient();

  // Build a fresh signed URL whenever the stored path changes.
  // Signed URLs work even when the bucket is private (which "cv-files" is).
  const refreshCvUrl = useCallback(async (path: string | null) => {
    if (!path) {
      setCvUrl(null);
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from(CV_BUCKET)
        .createSignedUrl(path, 60 * 60); // 1 hour
      if (error) throw error;
      setCvUrl(data?.signedUrl ?? null);
    } catch (e: any) {
      console.error("[ResumeUploader] Signed URL failed:", e?.message);
      setCvUrl(null);
    }
  }, [supabase]);

  useEffect(() => {
    refreshCvUrl(currentCvPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCvPath]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const filePath = `applicant-resumes/${userId}/${Date.now()}_${file.name.replace(/[^\w.\- ]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(filePath, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("applicant_profiles")
        .update({ cv_path: filePath })
        .eq("id", userId);
      if (updateError) throw updateError;

      setCvPath(filePath);
      await refreshCvUrl(filePath);
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      const message =
        err?.message?.includes("could not find the bucket") ||
        err?.statusCode === 404
          ? "Storage bucket is missing. Please run the latest database migration to create it."
          : err?.message || "Failed to upload resume";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!cvPath) return;
    setDeleting(true);
    try {
      await supabase.storage.from(CV_BUCKET).remove([cvPath]);
      const { error: updateError } = await supabase
        .from("applicant_profiles")
        .update({ cv_path: null })
        .eq("id", userId);
      if (updateError) throw updateError;
      setCvPath(null);
      setCvUrl(null);
      toast.success("Resume deleted");
    } catch (e: any) {
      toast.error("Failed to delete resume");
    } finally {
      setDeleting(false);
    }
  };

  // Force a download (attachment) with the original filename instead of
  // navigating the browser to the PDF.
  const handleDownload = async () => {
    if (!cvUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(cvUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || "Resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("[ResumeUploader] Download failed:", err);
      // Fallback: open the signed URL in a new tab
      window.open(cvUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

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
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-border dark:border-slate-700">
      <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-teal" /> Your Resume
      </h2>

      {!cvPath ? (
        <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-2xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <UploadCloud className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="font-semibold text-primary dark:text-white text-lg mb-2">Upload your resume</h3>
          <p className="text-sm text-text-secondary dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Upload your latest resume in PDF format. Max file size: 10MB.
          </p>
          <div className="relative inline-block">
            <Button variant="gradient" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...
                </>
              ) : (
                "Select File"
              )}
            </Button>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-2xl gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 dark:border-slate-700 shrink-0">
                <FileText className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-lg">
                  Resume Active <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </h3>
                {fileName && <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mt-1 truncate">{fileName}</p>}
                <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">Uploaded on {uploadDate}</p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!cvUrl || downloading}
                className="bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-rose-500 border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/40"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="w-full h-[600px] border border-border dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner">
            {cvUrl ? (
              <iframe src={`${cvUrl}#toolbar=0`} className="w-full h-full" title="Resume Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                {cvPath ? "Could not load preview — try the Download button." : "Loading preview..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
