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