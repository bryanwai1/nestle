// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function FreezeOverlay() {
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const { data } = await supabase
        .from('event_control')
        .select('frozen')
        .eq('id', 1)
        .single();
      if (active && data) setFrozen(!!data.frozen);
    }
    load();

    const channel = supabase
      .channel('event_control_overlay')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_control' },
        (payload) => {
          const next = payload?.new?.frozen;
          if (typeof next === 'boolean') setFrozen(next);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!frozen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070f1f]/95 px-6 text-center backdrop-blur-sm">
      <div className="mb-6 text-6xl">⏸️</div>
      <h2 className="text-3xl font-black text-white">Paused by facilitator</h2>
      <p className="mt-3 max-w-md text-slate-300">
        Please look up at the front. The activity will resume shortly.
      </p>
      <div className="mt-6 h-1 w-48 animate-pulse rounded-full bg-gradient-to-r from-[#E4002B] via-amber-400 to-[#2a7fff]" />
    </div>
  );
}
