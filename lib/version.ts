/**
 * InternIQ build metadata — exposed in Settings for debugging.
 * Values are injected at build time via next.config.mjs env block.
 */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";

export function formatBuildDate(): string {
  if (!BUILD_DATE) return "Unknown";
  try {
    return new Date(BUILD_DATE).toLocaleString();
  } catch {
    return BUILD_DATE;
  }
}
