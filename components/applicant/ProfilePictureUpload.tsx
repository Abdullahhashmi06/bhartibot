"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProfilePicture, getProfilePictureUrl } from "@/lib/queries/storage";
import { getAvatarUrl } from "@/lib/utils";
import { Camera, X, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Downscale + re-encode an image client-side so profile pictures always fit
 * under the 8 MB storage limit (and render fast). Handles photos straight
 * from a phone camera that are often 8–20 MB.
 */
async function compressImage(file: File, maxDimension = 1024, quality = 0.85): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // fall back to original if decoding fails

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );
  if (!blob) return file;

  const ext = mime === "image/png" ? "png" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, {
    type: mime,
  });
}

interface ProfilePictureUploadProps {
  userId: string;
  currentAvatarPath?: string | null;
  email: string;
  onAvatarUpdate: (path: string) => void;
}

export default function ProfilePictureUpload({
  userId,
  currentAvatarPath,
  email,
  onAvatarUpdate,
}: ProfilePictureUploadProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [hasAvatar, setHasAvatar] = useState(!!currentAvatarPath);

  // ── Load existing avatar via signed URL on mount ──────────────────────────
  // useEffect (not useState) is the correct hook for side effects.
  useEffect(() => {
    if (!currentAvatarPath) return;

    getProfilePictureUrl(supabase, currentAvatarPath).then((url) => {
      if (url) {
        setAvatarUrl(url);
        setHasAvatar(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAvatarPath]);

  /** The URL to show: local preview first, then signed URL, then initials avatar */
  const displayUrl = preview || avatarUrl || getAvatarUrl(email);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";

    // ── Client-side validation ────────────────────────────────────────────
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("File size must be under 12 MB. Please pick a smaller image.");
      return;
    }

    // Photos are compressed below the 8 MB storage limit before upload, but
    // guard here too so the user gets a friendly message instead of a failure.
    if (file.size > 8 * 1024 * 1024) {
      toast.info("Large image detected — compressing before upload...");
    }

    // Compress the image client-side so uploads never bounce on size limits.
    const uploadFile = await compressImage(file);

    // Show local preview immediately so the user sees feedback
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(uploadFile);

    setIsUploading(true);

    // ── Upload to Supabase Storage ─────────────────────────────────────────
    const { path, error } = await uploadProfilePicture(supabase, uploadFile, userId);

    if (error || !path) {
      const msg =
        error || "Failed to upload image.";
      // Friendly hint when the storage bucket/policies are missing.
      toast.error(
        msg.includes("bucket") || msg.includes("not found") || msg.includes("denied")
          ? "Profile picture upload needs the latest database migration (avatars bucket). Please run it once, then retry."
          : msg
      );
      setPreview(null);
      setIsUploading(false);
      return;
    }

    // ── Persist the path in applicant_profiles ─────────────────────────────
    const { error: updateError } = await supabase
      .from("applicant_profiles")
      .update({ avatar_path: path })
      .eq("id", userId);

    if (updateError) {
      console.error("[ProfilePictureUpload] Failed to save avatar path:", updateError.message);
    }

    // ── Fetch signed URL and swap preview → real URL ───────────────────────
    const signedUrl = await getProfilePictureUrl(supabase, path);
    setIsUploading(false);

    if (signedUrl) {
      setAvatarUrl(signedUrl);
      setPreview(null);
      setHasAvatar(true);
      onAvatarUpdate(path);
      toast.success("Profile picture updated!");
    } else {
      // Keep local preview so the user at least sees their image
      toast.success("Profile picture uploaded! Refresh to see it.");
      onAvatarUpdate(path);
    }
  }

  async function handleRemove() {
    if (currentAvatarPath) {
      // Best-effort delete — don't block the UI on failure
      supabase.storage
        .from("avatars")
        .remove([currentAvatarPath])
        .catch((err) => console.error("[ProfilePictureUpload] Storage remove failed:", err));

      await supabase
        .from("applicant_profiles")
        .update({ avatar_path: null })
        .eq("id", userId);
    }

    setAvatarUrl(null);
    setPreview(null);
    setHasAvatar(false);
    onAvatarUpdate("");
    toast.success("Profile picture removed.");
  }

  return (
    <div className="relative group">
      {/* ── Avatar Display ────────────────────────────────────────────────── */}
      <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-teal bg-slate-100">
        <img
          src={displayUrl}
          alt={`${email} profile`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials-based avatar if URL is broken
            (e.target as HTMLImageElement).src = getAvatarUrl(email);
          }}
        />

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <span className="text-[10px] text-white font-semibold">Uploading...</span>
          </div>
        )}
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="absolute -bottom-2 -right-2 flex gap-1">
        {/* Upload / Replace button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-9 w-9 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
          title={hasAvatar ? "Replace photo" : "Upload photo"}
        >
          <Camera className="h-4 w-4" />
        </button>

        {/* Remove button — only shown when an avatar exists */}
        {hasAvatar && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="h-9 w-9 rounded-full bg-danger text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
            title="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Hidden file input ─────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ── Helper text below avatar ──────────────────────────────────────── */}
      <p className="mt-4 text-center text-[10px] text-text-muted leading-snug max-w-[7rem]">
        JPG, PNG, WEBP<br />Max 12 MB (auto-compressed)
      </p>
    </div>
  );
}
