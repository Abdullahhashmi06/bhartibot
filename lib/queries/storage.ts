import type { SupabaseClient } from "@supabase/supabase-js";

/** Upload profile picture to Supabase Storage. */
export async function uploadProfilePicture(
  supabase: SupabaseClient,
  file: File,
  userId: string
): Promise<{ path: string | null; error: string | null }> {
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!fileExt || !["jpg", "jpeg", "png", "webp"].includes(fileExt)) {
    return { path: null, error: "Invalid file type. Only JPG, PNG, and WEBP are allowed." };
  }

  if (file.size > 8 * 1024 * 1024) {
    return { path: null, error: "File size exceeds the 8 MB limit." };
  }

  const fileName = `avatar-${userId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (error || !data) {
    return {
      path: null,
      error: error?.message ?? "Failed to upload profile picture.",
    };
  }

  return {
    path: data.path,
    error: null,
  };
}

/** Get signed URL for a profile picture. */
export async function getProfilePictureUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60 * 24); // 24 hours

  if (error) {
    console.error("Profile picture signed URL error:", error);
    return null;
  }

  return data?.signedUrl ?? null;
}

/** Get public URL for a profile picture (for public non-authenticated access). */
export function getProfilePicturePublicUrl(
  supabase: SupabaseClient,
  path: string
): string {
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl ?? "";
}

export async function uploadCv(
  supabase: SupabaseClient,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  // Preserve the original filename (sanitized) with a timestamp prefix so the
  // recruiter can always download the resume under its real name. The
  // timestamp is stripped on the display/download side via
  // extractOriginalFilename().
  //
  // The `public-apply/` folder prefix matches the storage RLS INSERT policy
  // (security hardening): anonymous and signed-in applicants may only write
  // under public-apply/, keeping the bucket from becoming an arbitrary-write
  // target while preserving the anonymous apply flow.
  const fileExt = file.name.split(".").pop() || "pdf";
  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.\- ]/g, "_")
    .slice(0, 80) || "resume";
  const fileName = `public-apply/${Date.now()}_${safeBase}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("cv-files")
    .upload(fileName, file, { contentType: "application/pdf" });

  if (error || !data) {
    return {
      path: null,
      error: error?.message ?? "Failed to upload CV.",
    };
  }

  return {
    path: data.path,
    error: null,
  };
}

export async function getCvSignedUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("cv-files")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }

  return data?.signedUrl ?? null;
}

/** Download CV bytes for server-side AI processing. */
export async function downloadCvBuffer(
  supabase: SupabaseClient,
  path: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage.from("cv-files").download(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download CV from storage.");
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}