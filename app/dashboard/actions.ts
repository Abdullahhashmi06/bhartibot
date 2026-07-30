"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { duplicateInternship, archiveInternship, restoreInternship } from "@/lib/queries/internships";

export async function duplicateInternshipAction(internshipId: string) {
  const supabase = createClient();
  const { error } = await duplicateInternship(supabase, internshipId);
  if (error) {
    throw new Error(error);
  }
  revalidatePath("/dashboard");
}

export async function archiveInternshipAction(internshipId: string) {
  const supabase = createClient();
  const { error } = await archiveInternship(supabase, internshipId);
  if (error) {
    throw new Error(error);
  }
  revalidatePath("/dashboard");
}

export async function restoreInternshipAction(internshipId: string) {
  const supabase = createClient();
  const { error } = await restoreInternship(supabase, internshipId);
  if (error) {
    throw new Error(error);
  }
  revalidatePath("/dashboard");
}
