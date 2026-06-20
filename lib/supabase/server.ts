// lib/supabase/server.ts
// Use this inside Server Components, Server Actions, and Route Handlers.
// It reads/writes the auth cookie so admin sign-in (Supabase Auth) persists
// across requests. Player flows generally don't need this — they use the
// anon browser client directly since they're not authenticated users.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without a writable response —
            // safe to ignore as long as you also have middleware refreshing
            // the session (see middleware.ts).
          }
        },
      },
    }
  );
}
