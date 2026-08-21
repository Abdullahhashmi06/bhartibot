import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes the session via cookies so the server
 * always knows who's logged in.
 *
 * Do NOT reuse this in Client Components — use lib/supabase/client.ts there.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}

/**
 * Lightweight user identity extracted from the x-user-id / x-user-email
 * headers set by middleware.  Returns `null` when the headers are absent
 * (e.g. public pages that bypass auth).
 *
 * Use this in Server Components and Server Actions instead of calling
 * `supabase.auth.getUser()` again — the middleware already verified the
 * session and injected the identity.
 */
export function getUserFromHeaders(): {
  id: string;
  email: string;
} | null {
  const h = headers();
  const id = h.get("x-user-id");
  const email = h.get("x-user-email");
  if (!id) return null;
  return { id, email: email ?? "" };
}
