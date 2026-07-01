// components/admin/LiveLeaderboardTicker.tsx
'use client';
import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES } from '@/lib/game/questions';

export function LiveLeaderboardTicker() {
  const { teams, loading } = useRealtimeLeaderboard();
  const [progress, setProgress] = useState<Record<string, Record<string, string>>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!teams.length) return;
    async function load() {
      const { data } = await (supabase as any)
        .from('team_module_progress')
        .select('team_id, module_id, status')
        .in('team_id', teams.map(t => t.id));
      if (data) {
        const map: Record<string, Record<string, string>> = {};
        data.forEach((r: any) => {
          if (!map[r.team_id]) map[r.team_id] = {};
          map[r.team_id][r.module_id] = r.status;
        });
        setProgress(map);
      }
    }
    load();
  }, [teams]);

  const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'in_progress' ? '#f59e0b' : '#1e293b';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1628] shadow-xl h-full">
      <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Live Leaderboard</h2>
        <span className="text-xs text-slate-400">{teams.length} teams</span>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {loading ? (
          <p className="p-5 text-sm text-slate-400">Loading…</p>
        ) : teams.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No teams in this session yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {teams.map((t, i) => {
              const members = [t.member_1_name, t.member_2_name, t.member_3_name, (t as any).member_4_name].filter(Boolean);
              const tp = progress[t.id] ?? {};
              const completed = Object.values(tp).filter(s => s === 'completed').length;
              return (
                <div key={t.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-white/10 text-white'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">Team {t.team_number}</p>
                        <p className="text-xs text-slate-400">{members.join(' · ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white tabular-nums">{t.current_total_score} pts</p>
                      <p className="text-xs text-slate-500">{completed}/{MODULES.length} modules</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-0.5">
                    {MODULES.map(m => (
                      <div key={m.id} style={{ backgroundColor: statusColor(tp[m.id] ?? '') }}
                        className="h-1.5 flex-1 rounded-full" title={m.title.en} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
