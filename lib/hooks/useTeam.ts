// lib/hooks/useTeam.ts
//
// Players never sign in — "create team" / "join team" just remembers a
// team_id in this device's localStorage. That's intentionally lightweight
// for a one-day kiosk-style event; see the RLS note in 0001_init.sql if you
// want to harden this with per-team anonymous auth for a recurring event.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

const STORAGE_KEY = 'she-day-2026:team';

interface StoredTeam {
  id: string;
  team_number: number;
}

export function useTeam() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const hydrate = useCallback(async () => {
    setLoading(true);
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      setTeam(null);
      setLoading(false);
      return;
    }
    const stored: StoredTeam = JSON.parse(raw);
    const { data, error } = await supabase.from('teams').select('*').eq('id', stored.id).single();
    if (error || !data) {
      localStorage.removeItem(STORAGE_KEY);
      setTeam(null);
    } else {
      setTeam(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  /** Calls the create_team() RPC — atomic, race-condition-safe numbering.
   * See supabase/migrations/0001_init.sql for why this isn't a plain insert. */
  const createTeam = useCallback(
    async (member1: string, member2: string, member3: string, sessionGroup: 'morning' | 'afternoon', region: string, member4?: string) => {
      const { data, error } = await supabase.rpc('create_team', {
        p_member_1: member1,
        p_member_2: member2,
        p_member_3: member3,
        p_session_group: sessionGroup,
        p_region: region,
        p_member_4: member4 ?? null,
      });
      if (error || !data) throw error ?? new Error('Could not create team');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: data.id, team_number: data.team_number }));
      setTeam(data);
      return data;
    },
    [supabase]
  );

  /** Join an existing team — this is the dropdown flow from the wireframe
   * annotation, not free text, so it's just "pick from the list". */
  const joinTeam = useCallback(
    async (teamId: string) => {
      const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).single();
      if (error || !data) throw error ?? new Error('Team not found');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: data.id, team_number: data.team_number }));
      setTeam(data);
      return data;
    },
    [supabase]
  );

  const leaveTeam = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTeam(null);
  }, []);

  return { team, loading, createTeam, joinTeam, leaveTeam, refresh: hydrate };
}
