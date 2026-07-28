import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadCv(
  supabase: SupabaseClient,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("cv-files")
    .upload(fileName, file);

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