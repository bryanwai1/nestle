// lib/supabase/admin.ts
//
// SERVICE ROLE KEY — server-only, bypasses RLS entirely. Never import this
// file from a 'use client' component or a file that gets bundled to the
// browser; Next.js will happily leak the key into client JS if you do.
// It's used in exactly two places in this codebase:
//   - app/api/speed-bonus/route.ts  (admin awards the +50 bonus)
//   - app/admin/dashboard's server actions for grading, where we want a
//     belt-and-suspenders guarantee independent of the RLS policy.
//
// If you'd rather rely on RLS + the authenticated admin's own session for
// everything, you can delete this file and use lib/supabase/server.ts in
// the admin routes instead — both are valid, this is the "fast path".

import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local'
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
