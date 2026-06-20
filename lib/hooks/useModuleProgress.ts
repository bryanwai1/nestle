// lib/hooks/useModuleProgress.ts

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ModuleProgressStatus } from '@/types/database';

export function useModuleProgress(teamId: string | undefined) {
  const [progress, setProgress] = useState<Record<string, ModuleProgressStatus>>({});

  useEffect(() => {
    if (!teamId) return;
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from('team_module_progress')
        .select('module_id, status')
        .eq('team_id', teamId as string);
      if (!cancelled && data) {
        setProgress(Object.fromEntries(data.map((d) => [d.module_id, d.status])));
      }
    }
    load();

    const channel = supabase
      .channel(`progress-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_module_progress', filter: `team_id=eq.${teamId}` },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return progress;
}
