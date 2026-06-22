// lib/supabase/client.ts
// Use this in Client Components ('use client'). For Server Components /
// Route Handlers use lib/supabase/server.ts instead — don't cross the
// streams, the cookie handling is different in each.

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
