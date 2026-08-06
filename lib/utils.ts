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
 * Sanitizes a `next`/redirect parameter to a safe internal path.
 *
 * Prevents open-redirect: only relative paths starting with a single "/" are
 * accepted. Absolute URLs (https://evil.com), protocol-relative URLs
 * (//evil.com), backslash tricks (\evil.com), and anything else fall back to
 * `fallback`. Use for every `?next=`-style redirect target.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/"
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) return fallback;
  // Browsers treat backslashes as forward slashes for special schemes, so
  // `//evil.com`, `/\\evil.com` and `\evil.com` all resolve to an external
  // host. Normalize backslashes, then reject anything scheme-relative.
  const normalized = trimmed.replace(/\\/g, "/");
  if (normalized.startsWith("//")) return fallback;
  return trimmed;
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

/**
 * Deterministic date formatting.
 *
 * Uses a FIXED locale ("en-GB") and FIXED timezone ("UTC") so server-rendered
 * HTML and the client's first render are byte-identical. Locale-dependent APIs
 * such as toLocaleDateString() produce different output on the server (e.g.
 * "12/08/2026") vs the client (e.g. "8/12/2026") and cause React hydration
 * mismatches — these helpers can never do that.
 */
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const MEDIUM_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Short deterministic date, e.g. "08/12/2026" (DD/MM/YYYY, UTC). */
export function formatDateShort(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return SHORT_DATE_FORMATTER.format(date);
}

/** Short deterministic date + time, e.g. "12 Aug, 14:30" (UTC). */
export function formatDateTimeShort(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return MEDIUM_DATETIME_FORMATTER.format(date);
}
