/**
 * Offline Action Queue (InternIQ)
 *
 * A tiny localStorage-backed queue for non-sensitive actions that should be
 * retried when connectivity returns (e.g. "saved internship while offline").
 *
 * - Sensitive data (auth tokens, resume uploads, candidate PDFs) must NEVER
 *   be queued here — this module refuses to store secrets.
 * - Background sync: the service worker broadcasts `INTERNIQ_SYNC` via the
 *   `sync` event; the client flushes the queue on receipt and on `online`.
 */

export type OfflineAction =
  | { type: "toggle-save"; internshipId: string }
  | { type: "apply-later"; internshipId: string };

const QUEUE_KEY = "interniq-offline-queue";

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

function persistQueue(queue: OfflineAction[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full or unavailable — drop silently */
  }
}

/**
 * Enqueue an action for retry when back online.
 *
 * Security: the OfflineAction union only carries internship IDs — it has no
 * shape for auth tokens, resume uploads, or candidate PDFs. If the union is
 * ever extended with payloads, review this function before adding secrets.
 */
export function enqueueOfflineAction(action: OfflineAction): void {
  const queue = getOfflineQueue();
  // De-dupe identical pending actions
  const exists = queue.some(
    (a) => JSON.stringify(a) === JSON.stringify(action)
  );
  if (!exists) {
    persistQueue([...queue, action]);
  }
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Flush queued actions. Callers must register a processor (e.g. the applicant
 * portal's save toggle) that performs the real work, e.g. a supabase upsert.
 *
 * - If no processor is registered yet, the queue is PRESERVED (never silently
 *   dropped) so a future processor can still handle the actions.
 * - Failed actions are kept for the next flush; successes are removed.
 */
export async function flushOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  if (typeof navigator === "undefined" || !navigator.onLine) return;

  const processor = (window as unknown as {
    __interniqQueueProcessor?: (a: OfflineAction) => Promise<void>;
  }).__interniqQueueProcessor;

  // No processor → keep the queue intact for later.
  if (!processor) return;

  const remaining: OfflineAction[] = [];
  for (const action of queue) {
    try {
      await processor(action);
    } catch {
      remaining.push(action);
    }
  }
  persistQueue(remaining);
}

/** Register a queue processor that flushOfflineQueue delegates to. */
export function registerQueueProcessor(
  processor: (a: OfflineAction) => Promise<void>
): void {
  (window as unknown as {
    __interniqQueueProcessor?: (a: OfflineAction) => Promise<void>;
  }).__interniqQueueProcessor = processor;
}
