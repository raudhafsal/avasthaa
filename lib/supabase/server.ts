import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the request's cookies, so the
 * user's session (and therefore their RLS-scoped role) travels correctly.
 * Anon key only. Use createAdminClient() (service-role) exclusively from
 * trusted server contexts — never from anything reachable by client input
 * without its own authorization check.
 *
 * Deliberately untyped (no <Database> generic) until real generated
 * types exist — see the matching note in lib/supabase/client.ts.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component with no request context;
            // middleware.ts refreshes the session instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // See note above.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. SERVER-ONLY. Bypasses RLS entirely — restrict use
 * to trusted internal operations (admin actions already authorized by a
 * verified admin session, scheduled jobs, webhooks with verified
 * signatures). Never expose this client or its key to any client bundle.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must never run in the browser.");
  }
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
