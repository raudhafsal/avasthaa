/**
 * This file re-exports the generated Supabase types. Once your Supabase
 * project is connected, run:
 *
 *   npm run supabase:types
 *
 * That overwrites types/database.generated.ts from the live schema (which
 * matches supabase/migrations/*.sql exactly). Until then this stub keeps
 * the rest of the app compiling.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// `any` (not `Record<string, unknown>`) deliberately: postgrest-js's
// select-string parser needs a concrete column shape to type a query's
// result, and an index-signature Row type resolves every selected column
// to `never` rather than `unknown`. Real generated types (see the note
// above) fix this properly — this stub just keeps the app compiling
// until then, so it types individual queries loosely rather than wrongly.
export interface Database {
  public: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
