import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a clean avatar URL using DiceBear API based on a name or seed.
 */
export function getAvatarUrl(seed: string): string {
  const cleanSeed = encodeURIComponent(seed.trim() || "Applicant");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}&backgroundColor=0b1f3a,17c6b5,6f52ed&radius=50`;
}
