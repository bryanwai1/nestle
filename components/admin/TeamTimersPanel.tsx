// components/admin/TeamTimersPanel.tsx
// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES } from '@/lib/game/questions';

const MODULE_TIMERS: Record<string, number> = {
  'module-1-safe-driving': 25*60,
  'module-2-stf': 10*60,
  'module-3-heart-health': 10*60,
  'module-4-mental-health': 5*60,
  'module-5-ergonomics': 8*60,
  'module-6-exercise': 10*60,
  'module-7-diet': 2*60,
  'module-8-medical-emergency': 20*60,
  'module-9-fire-emergency': 2*60,
  'module-10-recycling': 5*60,
};

function fmt(s: number) {
  if (s <= 0) return '00:00';
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

type Row = { team_number: number; module_id: string; started_at: string };

export function TeamTimersPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [now, setNow] = useState(Date.now());
  const supabase = createClient();

  async function load() {
    const { data } = await (supabase as any)
      .from('team_module_progress')
      .select('team_id, module_id, started_at, teams(team_number)')
      .eq('status', 'in_progress');
    if (data) setRows(data.map((r: any) => ({
      team_number: r.teams?.team_number ?? '?',
      module_id: r.module_id,
      started_at: r.started_at,
    })));
  }

  useEffect(() => {
    load();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const channel = supabase.channel('timers_panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_module_progress' }, load)
      .subscribe();
    return () => { clearInterval(tick); supabase.removeChannel(channel); };
  }, []);

  if (rows.length === 0) return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B2545] to-[#0a1d3a] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">Live Timers</p>
      <h3 className="mt-1 text-lg font-bold text-white">Team Timers</h3>
      <p className="mt-3 text-sm text-slate-400">No teams currently playing.</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B2545] to-[#0a1d3a] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">Live Timers</p>
      <h3 className="mt-1 mb-3 text-lg font-bold text-white">Team Timers</h3>
      <div className="space-y-2">
        {rows.map((r) => {
          const duration = MODULE_TIMERS[r.module_id] ?? 600;
          const elapsed = Math.floor((now - new Date(r.started_at).getTime()) / 1000);
          const remaining = duration - elapsed;
          const mod = MODULES.find(m => m.id === r.module_id);
          const isLow = remaining < 60;
          const isDone = remaining <= 0;
          return (
            <div key={`${r.team_number}-${r.module_id}`}
              className={`flex items-center justify-between rounded-xl px-3 py-2 ${isDone ? 'bg-red-900/40 border border-red-500/50' : isLow ? 'bg-red-500/20 border border-red-400/40' : 'bg-white/5'}`}>
              <div>
                <p className="text-sm font-bold text-white">Team {r.team_number}</p>
                <p className="text-xs text-slate-400">{mod?.title.en ?? r.module_id}</p>
              </div>
              <p className={`text-xl font-black tabular-nums ${isDone ? 'text-red-400' : isLow ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                {isDone ? 'TIME UP' : fmt(remaining)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
