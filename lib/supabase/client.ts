"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon key only — RLS enforces
 * every access rule server-side. Never import the service-role key here.
 *
 * Deliberately untyped (no <Database> generic) until real generated
 * types exist: run `npm run supabase:types` once your Supabase project
 * is connected, then add `<Database>` back here — postgrest-js's
 * column-selection generics need concrete Row shapes to type queries
 * correctly, and our placeholder types/database.ts stub isn't one.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
