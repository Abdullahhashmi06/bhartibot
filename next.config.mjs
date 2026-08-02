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
