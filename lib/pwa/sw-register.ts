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

export function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isSwSupported()) return Promise.resolve(null);
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch((err) => {
        console.warn("[InternIQ PWA] Service worker registration failed:", err);
        return null;
      });
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
