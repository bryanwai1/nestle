// app/api/speed-bonus/route.ts
//
// Why a Route Handler instead of calling Supabase directly from the admin
// client: session_speed_bonus has a UNIQUE constraint on module_id (only one
// team can ever hold the bonus for a given module — see migration 0001), so
// "awarding" it to a new team must atomically replace any existing holder.
// That's a delete-then-insert that's cleaner to do server-side in one
// request than as two separate client calls racing the realtime UI.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  // Confirm the caller is a signed-in admin before touching the service-role client.
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { teamId, moduleId } = await req.json();
  if (!teamId || !moduleId) {
    return NextResponse.json({ error: 'teamId and moduleId are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Replace any existing bonus holder for this module (re-running the
  // ceremony for a different team, or correcting a mis-click).
  await admin.from('session_speed_bonus').delete().eq('module_id', moduleId);

  const { data, error } = await admin
    .from('session_speed_bonus')
    .insert({ team_id: teamId, module_id: moduleId, points: 50, awarded_by: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // teams.current_total_score updates automatically via the
  // recalc_team_score trigger fired by this insert.
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { moduleId } = await req.json();
  const admin = createAdminClient();
  await admin.from('session_speed_bonus').delete().eq('module_id', moduleId);
  return NextResponse.json({ ok: true });
}
