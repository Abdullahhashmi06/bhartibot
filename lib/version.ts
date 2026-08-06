/**
 * InternIQ build metadata — exposed in Settings for debugging.
 * Values are injected at build time via next.config.mjs env block.
 */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";

// Fixed locale + fixed timezone so the rendered value is identical on the
// server and the client (locale-dependent toLocaleString() breaks hydration).
const BUILD_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatBuildDate(): string {
  if (!BUILD_DATE) return "Unknown";
  try {
    return BUILD_DATE_FORMATTER.format(new Date(BUILD_DATE));
  } catch {
    return BUILD_DATE;
  }
}
