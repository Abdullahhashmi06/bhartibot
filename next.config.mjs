import withSerwistInit from "@serwist/next";
import { execSync } from "node:child_process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  // ── Security headers ───────────────────────────────────────────────────────
  // Defense-in-depth for production: clickjacking, MIME sniffing, referrer
  // leakage, permissions. CSP is scoped to allow only the origins the app
  // genuinely talks to (Google reCAPTCHA, Google Fonts, Supabase, DiceBear).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js injects inline scripts (hydration) + the theme script.
              // 'unsafe-eval' is only needed by the webpack HMR dev runtime,
              // so it is added in development and dropped in production.
              `script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com${
                process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
              }`,
              // Next.js injects inline styles; Google Fonts is a stylesheet.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // DiceBear avatars + Supabase storage signed-URL images.
              "img-src 'self' data: blob: https://*.supabase.co https://api.dicebear.com",
              // Supabase REST/realtime, reCAPTCHA client + verification, and
              // the reCAPTCHA host used by the invisible v3 token flow.
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google.com https://recaptcha.google.com",
              // CV preview iframes render Supabase signed URLs.
              "frame-src 'self' https://*.supabase.co https://www.google.com https://accounts.google.com",
              "worker-src 'self'",
              "manifest-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Build-time app version info, exposed to the client via NEXT_PUBLIC_*
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
    NEXT_PUBLIC_BUILD_ID: (() => {
      try {
        return (
          process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
          execSync("git rev-parse --short HEAD").toString().trim()
        );
      } catch {
        return "dev";
      }
    })(),
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
};

const withSerwist = withSerwistInit({
  // Service worker source and destination
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Precache the offline page so the fallback always works offline.
  // revision: null → the precache copy refreshes when response headers change.
  additionalPrecacheEntries: [{ url: "/offline", revision: null }],
  // Manual registration in a client component (lib/pwa/sw-register.ts) gives
  // us full control over the update lifecycle (update banner, controllerchange
  // reload) — disable Serwist's auto-injected registration snippet.
  register: false,
  // CRITICAL: never run the service worker in development. Dev chunks are
  // volatile (webpack.js + hashed chunks change on every rebuild), and a stale
  // worker intercepting navigations can serve an old chunk alongside new ones.
  // Mixing two React copies is exactly what produces the
  // "Invalid hook call / Cannot read properties of null (reading 'useContext')"
  // crash inside next/link's LinkComponent. Production builds still get the SW.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
