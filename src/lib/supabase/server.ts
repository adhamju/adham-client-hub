import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side client that reads/writes the user's own session cookie.
 * Use this in Server Components and Server Actions — every query through
 * it is subject to that user's Row Level Security.
 *
 * In Next 15 `cookies()` is async, so the cookie accessors below await it
 * lazily. That keeps this factory synchronous for all callers.
 */
export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const store = await cookies();
          return store.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const store = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Called from a Server Component render — middleware already
            // refreshes the session, so this can be safely ignored.
          }
        },
      },
    }
  );
}

/**
 * Admin-privileged client that bypasses Row Level Security entirely.
 * ONLY use this in server code, after verifying the caller is an
 * authenticated admin — or for the one-time first-admin bootstrap.
 * Requires SUPABASE_SERVICE_ROLE_KEY, which must never be exposed to the
 * browser (no NEXT_PUBLIC_ prefix).
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Service-role client is not tied to a browser session.
        },
      },
    }
  );
}
