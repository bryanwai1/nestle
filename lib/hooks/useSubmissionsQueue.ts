// lib/hooks/useSubmissionsQueue.ts

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ResponseType } from '@/types/database';

export interface QueuedSubmission {
  id: string;
  team_id: string;
  module_id: string;
  question_id: string;
  response_type: ResponseType;
  response_data: Record<string, unknown>;
  media_url: string | null;
  text_response: string | null;
  created_at: string;
  teams: { team_number: number } | null;
}

export function useSubmissionsQueue() {
  const [submissions, setSubmissions] = useState<QueuedSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from('game_responses')
        .select('*, teams(team_number)')
        .is('is_correct', null)
        .order('created_at', { ascending: true });
      if (!cancelled) setSubmissions((data as unknown as QueuedSubmission[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('admin-submissions-queue-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_responses' }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { submissions, loading };
}
