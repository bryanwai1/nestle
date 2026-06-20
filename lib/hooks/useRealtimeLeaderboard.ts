// lib/hooks/useRealtimeLeaderboard.ts
//
// Subscribes to the `teams` table over Supabase Realtime. Because
// current_total_score is maintained entirely by the recalc_team_score()
// trigger (see migration), this hook never has to reconcile optimistic
// updates with server state — it just reflects whatever Postgres says,
// which is always correct.

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

export function useRealtimeLeaderboard(limit?: number) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      let query = supabase.from('teams').select('*').order('current_total_score', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data } = await query;
      if (!cancelled && data) setTeams(data);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('leaderboard-teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        // Any insert/update on teams (i.e. any score change) → just re-fetch
        // and re-sort. Simpler and just as fast as patching individual rows
        // for the team counts in this event (dozens, not thousands).
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { teams, loading };
}
