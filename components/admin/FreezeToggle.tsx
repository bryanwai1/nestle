// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function FreezeToggle() {
  const [frozen, setFrozen] = useState(false);
  const [busy, setBusy] = useState(false);

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
      .channel('event_control_admin')
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

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const next = !frozen;
    const { error } = await supabase
      .from('event_control')
      .update({ frozen: next })
      .eq('id', 1);
    if (!error) setFrozen(next);
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B2545] to-[#0a1d3a] p-5 shadow-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
        Event Control
      </p>
      <h3 className="mt-1 text-lg font-bold text-white">
        {frozen ? 'Screens are paused' : 'Screens are live'}
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        {frozen
          ? 'Every player screen is showing the "Paused" overlay.'
          : 'Pause every player screen at once to bring focus to the front.'}
      </p>
      <button
        onClick={toggle}
        disabled={busy}
        className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50 ${
          frozen
            ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500'
            : 'bg-[#E4002B] shadow-[#E4002B]/30 hover:bg-[#c4001f]'
        }`}
      >
        {busy ? 'Working…' : frozen ? '▶ Resume all screens' : '⏸ Freeze all screens'}
      </button>
    </div>
  );
}
