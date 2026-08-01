"use client";

import { useEffect } from "react";
import SplashScreen from "./SplashScreen";
import ConnectivityBanner from "./ConnectivityBanner";
import InstallPrompt from "./InstallPrompt";
import UpdatePrompt from "./UpdatePrompt";
import { getRegistration } from "@/lib/pwa/sw-register";

/**
 * Mounts every PWA experience piece from the root layout:
 *  - SplashScreen (native loading screen)
 *  - ConnectivityBanner (offline / back-online)
 *  - InstallPrompt (installable card)
 *  - UpdatePrompt (new version refresh banner)
 *  - Service worker registration + background sync registration
 */
export default function PwaRoot() {
  useEffect(() => {
    // Register the service worker (idempotent, memoized)
    void getRegistration().then((reg) => {
      // Register background sync for the offline action queue when supported
      if (reg && "sync" in reg) {
        reg.sync
          .register("interniq-sync")
          .catch(() => {
            /* background sync unsupported — gracefully ignore */
          });
      }
    });

    // Client-side queue flush when connectivity returns, or when the service
    // worker's background-sync event broadcasts INTERNIQ_SYNC.
    const flush = () => {
      // Lazy-import to keep the main bundle lean
      import("@/lib/sync/queue").then(({ flushOfflineQueue }) => {
        void flushOfflineQueue();
      });
    };
    const onSyncMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "INTERNIQ_SYNC") flush();
    };

    window.addEventListener("online", flush);
    navigator.serviceWorker?.addEventListener("message", onSyncMessage);
    return () => {
      window.removeEventListener("online", flush);
      navigator.serviceWorker?.removeEventListener("message", onSyncMessage);
    };
  }, []);

  return (
    <>
      <SplashScreen />
      <ConnectivityBanner />
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
