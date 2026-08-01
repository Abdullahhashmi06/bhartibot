/**
 * Push Notification Architecture (InternIQ)
 *
 * STATUS: Architecture prepared — backend push is intentionally NOT wired yet.
 *
 * The plan (documented so future work plugs in cleanly):
 *  1. Generate a VAPID key pair and add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to env.
 *  2. In `ensureNotificationPermission()` the client already gates permission.
 *  3. Subscribe: `registration.pushManager.subscribe({ userVisibleOnly: true,
 *     applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY) })`
 *  4. Persist the subscription in `user_push_subscriptions` and have the
 *     backend send notifications via web-push on:
 *       - application status updates
 *       - interview reminders
 *       - offer received
 *       - internship recommendations
 *       - recruiter messages
 *  5. Future: listen to Supabase realtime channels and show in-app toasts +
 *     push payloads for background events.
 *
 * This module only exposes the safe, dependency-free pieces: support checks
 * and permission gating. Nothing here touches the network.
 */

export type PushEventType =
  | "application_status"
  | "interview_reminder"
  | "offer_received"
  | "internship_recommendation"
  | "recruiter_message";

export interface PushEventPayload {
  type: PushEventType;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

/** True when the browser can show notifications (and permission is granted). */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getPushPermission():
  | NotificationPermission
  | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Gates notification permission. Returns "granted" | "denied" | "default" |
 * "unsupported". Safe to call from any client component.
 */
export async function requestPushPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

/**
 * Future entry point for subscribing to push. Kept as a stub so the UI can
 * be built today without the backend. Returns null until VAPID is configured.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || Notification.permission !== "granted") return null;
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;
  const reg = await navigator.serviceWorker.ready;
  try {
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ),
    });
  } catch {
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
