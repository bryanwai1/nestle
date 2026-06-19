import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/** Returns null when Supabase env vars are not yet configured. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient<Database>(url, key);
}
