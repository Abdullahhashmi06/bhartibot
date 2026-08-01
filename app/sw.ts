/// <reference lib="webworker" />

import {
  Serwist,
  CacheFirst,
  StaleWhileRevalidate,
  NetworkFirst,
  ExpirationPlugin,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

export {};

/**
 * InternIQ Service Worker
 *
 * Security rules (never cached):
 *  - Authenticated/private routes: /dashboard, /applicant, /talent-pool, /api, /applicant-auth
 *  - Supabase storage (resumes, CVs, PDFs) and any *.supabase.co request
 *  - Any cross-origin API response
 *
 * Safe to cache:
 *  - _next/static build assets (hashed, immutable)
 *  - Google Fonts (fonts.googleapis.com / fonts.gstatic.com)
 *  - Public brand assets (/icons, /brand, /splash, apple-touch-icon)
 *  - Public navigation shell (/, /login, /signup, /applicant-auth, /offline)
 *  - Dicebear avatars (public, non-sensitive)
 */

// Bare prefixes (no trailing slash) so BOTH "/applicant" and "/applicant/..."
// are matched — a trailing-slash-only prefix would let the exact path
// "/applicant" slip through and leak authenticated HTML into the cache.
const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/applicant",
  "/talent-pool",
  "/api",
  "/applicant-auth",
  // Token-keyed candidate review pages contain private recruiter/candidate
  // data — never cache them offline.
  "/share",
];

const isPrivatePath = (pathname: string) =>
  PRIVATE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));

const isSupabaseUrl = (url: URL) => url.hostname.includes("supabase.co");

// Cache version — bump this on every deploy so stale runtime caches written
// by a previous service worker version can NEVER be read again. Old
// `interniq-*` caches are purged in the activate handler below.
const SW_VERSION = "v2";
const CACHE_NAMES = {
  static: `interniq-static-${SW_VERSION}`,
  fonts: `interniq-fonts-${SW_VERSION}`,
  assets: `interniq-assets-${SW_VERSION}`,
  avatars: `interniq-avatars-${SW_VERSION}`,
  images: `interniq-images-${SW_VERSION}`,
  pages: `interniq-pages-${SW_VERSION}`,
};

// Purge any runtime cache from a previous SW version on activation, so a
// stale worker can never serve deleted chunks (the root cause of React's
// "Cannot read properties of null (reading 'removeChild')" after deploys).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const allowed = new Set(Object.values(CACHE_NAMES));
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((name) => name.startsWith("interniq-") && !allowed.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
  runtimeCaching: [
    // Next.js build assets — hashed, immutable, safe to cache first
    {
      matcher: ({ url }) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith("/_next/static/"),
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.static,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    // Google Fonts
    {
      matcher: ({ url }) =>
        url.hostname === "fonts.googleapis.com" ||
        url.hostname === "fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.fonts,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 90,
          }),
        ],
      }),
    },
    // Public brand assets (icons, splash, logo)
    {
      matcher: ({ url }) =>
        url.origin === self.location.origin &&
        /^\/(icons|brand|splash|favicon-|apple-touch-icon)/.test(
          url.pathname
        ),
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.assets,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 90,
          }),
        ],
      }),
    },
    // Dicebear avatars (public generated images) — direct origin
    {
      matcher: ({ url }) => url.hostname === "api.dicebear.com",
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.avatars,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    // Next.js image optimizer — only dicebear avatars are allowed through
    // (remotePatterns), so this is safe to cache first. Never matches
    // supabase storage URLs because those are never routed via /_next/image.
    {
      matcher: ({ url }) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith("/_next/image") &&
        !url.search.includes("supabase"),
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.images,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    // Public page navigations only — NetworkFirst with offline fallback.
    // Private routes are excluded so authenticated HTML is never cached.
    {
      matcher: ({ request, url }) => {
        if (request.mode !== "navigate") return false;
        if (url.origin !== self.location.origin) return false;
        if (isSupabaseUrl(url)) return false;
        return !isPrivatePath(url.pathname);
      },
      handler: new NetworkFirst({
        cacheName: CACHE_NAMES.pages,
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();

// Allow the client to trigger activation of a waiting service worker
// (used by the "A new version is available" update banner).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background sync registration — flush the offline action queue when
// connectivity returns. Gracefully no-ops in browsers without support.
self.addEventListener("sync", (event) => {
  if (event.tag === "interniq-sync") {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "INTERNIQ_SYNC" })
          );
        })
    );
  }
});
