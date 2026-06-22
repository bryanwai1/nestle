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
      let query = supabase
        .from('teams')
        .select('*')
        .order('current_total_score', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data } = await query;
      if (!cancelled && data) setTeams(data);
      if (!cancelled) setLoading(false);
    }
    load();

    // Unique channel name per mount prevents "callbacks after subscribe()"
    const channel = supabase
      .channel(`leaderboard-teams-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { teams, loading };
}
