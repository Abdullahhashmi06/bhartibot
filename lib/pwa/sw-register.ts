"use client";

/**
 * Service worker registration + lifecycle helpers (client-side only).
 * Registration happens once; the promise is memoized so multiple components
 * (update prompt, sync queue) share the same registration.
 */

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

export function isSwSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Self-heal stale service workers left over from a previous build/deploy.
 *
 * Scenario this fixes: a production `public/sw.js` was served and registered
 * in the browser, then the codebase changed (e.g. after a branch merge). The
 * old worker keeps intercepting navigations and serving stale cached chunks
 * (old `webpack.js`, old hashed `layout-*.css`), which 404 against the new
 * server and crash React with `Cannot read properties of null (reading
 * 'removeChild')` inside the error/redirect boundaries.
 *
 * If `/sw.js` no longer resolves on the server (deleted, dev mode, or the
 * build was cleaned), the stale registration is dropped and its `interniq-*`
 * runtime caches are purged so they can never be served again.
 */
export async function healStaleServiceWorker(): Promise<void> {
  if (!isSwSupported()) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return;

    // Does the server still serve a service worker at /sw.js?
    let swAvailable = false;
    try {
      const res = await fetch("/sw.js", { cache: "no-store" });
      swAvailable = res.ok;
    } catch {
      swAvailable = false;
    }

    if (swAvailable) return;

    await Promise.all(
      registrations.map((reg) =>
        reg.unregister().catch(() => {
          /* ignore */
        })
      )
    );

    // Purge runtime caches written by the stale worker.
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((name) => name.startsWith("interniq-"))
          .map((name) => caches.delete(name))
      );
    }
  } catch {
    // Never block app boot on SW hygiene.
  }
}

/**
 * True when the service worker should be registered in this environment.
 *
 * The worker is DISABLED in development (next.config.mjs `disable: true`),
 * because dev chunks are volatile — a stale worker can serve an old chunk
 * alongside new ones, loading two copies of React and crashing with
 * "Invalid hook call / Cannot read properties of null (reading 'useContext')".
 */
export function isSwEnabled(): boolean {
  return process.env.NODE_ENV !== "development";
}

export function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isSwSupported() || !isSwEnabled()) {
    // Dev: no worker exists to register — but still drop any stale worker left
    // over from a previous production build so it can never serve old chunks.
    void healStaleServiceWorker();
    return Promise.resolve(null);
  }
  if (!registrationPromise) {
    registrationPromise = (async () => {
      // Drop any stale registration before registering the current build.
      await healStaleServiceWorker();
      try {
        return await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
      } catch (err) {
        // /sw.js may be absent in some environments — expected and non-fatal.
        console.warn("[InternIQ PWA] Service worker registration failed:", err);
        return null;
      }
    })();
  }
  return registrationPromise;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari legacy
    window.navigator.standalone === true
  );
}

export function onControllerChange(cb: () => void): () => void {
  if (!isSwSupported()) return () => {};
  navigator.serviceWorker.addEventListener("controllerchange", cb);
  return () =>
    navigator.serviceWorker.removeEventListener("controllerchange", cb);
}

/** Ask a waiting service worker to activate (used by the update banner). */
export async function skipWaiting(): Promise<void> {
  const reg = await getRegistration();
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

// Notification permission helpers live in lib/push/notifications.ts —
// re-exported here so the PWA lifecycle module stays the single entry point
// for install/permission utilities.
export {
  requestPushPermission as ensureNotificationPermission,
  getPushPermission as getNotificationPermission,
} from "@/lib/push/notifications";
