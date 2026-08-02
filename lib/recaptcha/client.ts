"use client";

/**
 * Client-side Google reCAPTCHA v3 helpers.
 *
 * reCAPTCHA v3 is invisible — no checkbox, no image puzzles. The script is
 * loaded once (singleton), a token is minted per action, and the token is
 * verified against our server endpoint (which talks to Google) BEFORE the
 * sensitive operation (signup, login, OTP, apply, ...) proceeds.
 *
 * Environment variables:
 *   NEXT_PUBLIC_RECAPTCHA_SITE_KEY  (required to activate protection)
 */

let scriptPromise: Promise<boolean> | null = null;
let grecaptchaPromise: Promise<RecaptchaApi | null> | null = null;

function siteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}

/** Minimal reCAPTCHA v3 API surface we rely on. */
export interface RecaptchaApi {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

/**
 * Load the reCAPTCHA script. A successful load is cached; a failed load is
 * NOT cached so a transient network block / ad-blocker can be retried on the
 * next attempt instead of poisoning the whole session.
 */
function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (scriptPromise) return scriptPromise;

  const pending = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="recaptcha/api.js"]'
    );
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey() ?? ""
    )}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      // Remove the broken tag so the querySelector guard above doesn't treat
      // it as loaded on a retry — otherwise the retry can never re-fetch.
      script.remove();
      resolve(false);
    };
    document.head.appendChild(script);
  });

  scriptPromise = pending.then((ok) => {
    if (!ok) scriptPromise = null; // allow retry on next call
    return ok;
  });

  return scriptPromise;
}

/** Get a grecaptcha handle once loaded (also a singleton). */
function getGrecaptcha(): Promise<RecaptchaApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (grecaptchaPromise) return grecaptchaPromise;

  const attempt = (async (): Promise<RecaptchaApi | null> => {
    const loaded = await loadScript();
    if (!loaded) return null;
    // grecaptcha may still be initializing right after onload fires.
    for (let i = 0; i < 50 && !window.grecaptcha; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return window.grecaptcha ?? null;
  })();

  // Do NOT cache a permanent failure: a transient network block should not
  // poison the whole session. Reset whenever we fail to obtain the API so the
  // next call re-attempts (this also swallows rejections — no unhandled
  // rejection warnings).
  grecaptchaPromise = attempt.then((api) => {
    if (!api) grecaptchaPromise = null;
    return api;
  });

  return grecaptchaPromise;
}

/**
 * Mint a reCAPTCHA v3 token for the given action (e.g. "signup", "login",
 * "otp_request", "apply"). Returns null when reCAPTCHA is not configured or
 * unavailable — callers decide how to handle that (see verifyRecaptcha).
 */
export async function getRecaptchaToken(
  action: string
): Promise<string | null> {
  const key = siteKey();
  if (!key) return null;

  try {
    const grecaptcha = await getGrecaptcha();
    if (!grecaptcha) return null;
    await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
    return await grecaptcha.execute(key, { action });
  } catch (error) {
    console.error("[recaptcha] token mint failed:", error);
    return null;
  }
}

/**
 * High-level helper used by forms: mints a token, sends it to the server
 * verification endpoint, and returns whether the action is allowed.
 *
 * - If reCAPTCHA is not configured (dev/CI), passes through without blocking.
 * - If token minting fails (network/extension block), FAILS CLOSED so an
 *   unverifiable request is never silently accepted — the user sees a clean
 *   error and can retry.
 */
export async function verifyRecaptcha(action: string): Promise<{
  ok: boolean;
  skipped?: boolean;
}> {
  if (!siteKey()) {
    return { ok: true, skipped: true };
  }

  const token = await getRecaptchaToken(action);
  if (!token) {
    return { ok: false };
  }

  try {
    const res = await fetch("/api/recaptcha/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });

    if (!res.ok) {
      return { ok: false };
    }

    const data = (await res.json()) as { ok: boolean };
    return { ok: data.ok === true };
  } catch {
    return { ok: false };
  }
}

/** A safe, user-friendly message shown when verification fails. */
export function recaptchaErrorMessage(): string {
  return "We couldn't verify your request automatically. Please try again — if this keeps happening, let us know.";
}
