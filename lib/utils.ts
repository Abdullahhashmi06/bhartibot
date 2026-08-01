import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a clean avatar URL using DiceBear API based on a name or seed.
 * If avatarPath is provided, it returns a placeholder that should be resolved
 * by the caller via getProfilePictureUrl.
 */
export function getAvatarUrl(seed: string, avatarPath?: string | null): string {
  if (avatarPath) {
    // Return empty string — the caller should resolve via getProfilePictureUrl
    return "";
  }
  const cleanSeed = encodeURIComponent(seed.trim() || "Applicant");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}&backgroundColor=0b1f3a,17c6b5,6f52ed&radius=50`;
}

/**
 * Shared CGPA validation used by every form that collects a CGPA.
 * Accepts an empty value (not yet provided), a numeric value from 0–4,
 * or the literal "N/A" (case-insensitive).
 */
export function isValidCgpa(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.toUpperCase() === "N/A") return true;
  const num = parseFloat(trimmed);
  return !isNaN(num) && num >= 0 && num <= 4.0;
}

/**
 * Recover the original uploaded filename from a storage path.
 *
 * Storage paths look like:
 *   `applicant-resumes/<userId>/<timestamp>_My Resume.pdf`  (applicant portal)
 *   `<timestamp>_My Resume.pdf`                             (public apply flow)
 *
 * This strips directory prefixes and the leading `<timestamp>_` so the
 * recruiter download/preview shows (and downloads as) the real filename.
 */
export function extractOriginalFilename(path: string): string {
  const last = path.split("/").pop() || "resume.pdf";
  const stripped = last.replace(/^\d+_(.+)$/, "$1");
  return stripped || last;
}
