// app/admin/teams/page.tsx
// Live team tracker — shows every team, their current module, score,
// module progress, and speed bonus wins. Updates in real time.
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES } from '@/lib/game/questions';
import Link from 'next/link';

type Team = {
  id: string;
  team_number: number;
  member_1_name: string;
  member_2_name: string;
  member_3_name: string;
  member_4_name?: string;
  current_total_score: number;
  region?: string;
};
type Progress = { team_id: string; module_id: string; status: string };
type Bonus = { team_id: string; module_id: string; points: number };

export default function TeamsTrackerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const supabase = createClient();

  async function load() {
    const [{ data: t }, { data: p }, { data: b }] = await Promise.all([
      (supabase as any).from('teams').select('id,team_number,member_1_name,member_2_name,member_3_name,member_4_name,current_total_score,region').order('current_total_score', { ascending: false }),
      (supabase as any).from('team_module_progress').select('team_id,module_id,status'),
      (supabase as any).from('session_speed_bonus').select('team_id,module_id,points'),
    ]);
    if (t) setTeams(t);
    if (p) setProgress(p);
    if (b) setBonuses(b);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel('teams_tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_module_progress' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_speed_bonus' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function teamProgress(teamId: string) {
    return progress.filter(p => p.team_id === teamId);
  }
  function teamBonuses(teamId: string) {
    return bonuses.filter(b => b.team_id === teamId);
  }
  function currentModule(teamId: string) {
    const tp = teamProgress(teamId);
    const inProgress = tp.find(p => p.status === 'in_progress');
    if (inProgress) return MODULES.find(m => m.id === inProgress.module_id);
    const completed = tp.filter(p => p.status === 'completed').length;
    if (completed === MODULES.length) return null;
    return MODULES[completed];
  }
  function statusColor(status: string) {
    if (status === 'completed') return '#10b981';
    if (status === 'in_progress') return '#f59e0b';
    return '#cbd5e1';
  }

  return (
    <div className="min-h-screen bg-[#070f1f] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Live Team Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">{teams.length} teams · updates in real time</p>
          </div>
          <Link href="/admin/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5">
            ← Dashboard
          </Link>
        </div>

        <div className="space-y-3">
          {teams.map((team, idx) => {
            const tp = teamProgress(team.id);
            const tb = teamBonuses(team.id);
            const curr = currentModule(team.id);
            const completedCount = tp.filter(p => p.status === 'completed').length;
            const members = [team.member_1_name, team.member_2_name, team.member_3_name, team.member_4_name].filter(Boolean);
            return (
              <div key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4002B] text-sm font-black">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">Team {team.team_number}</p>
                      <p className="text-xs text-slate-400">{members.join(' · ')}</p>
                      {team.region && <p className="text-xs text-sky-400 mt-0.5">{team.region}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {tb.length > 0 && (
                      <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-bold text-yellow-400">
                        ⚡ {tb.length}× speed bonus
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{team.current_total_score} pts</p>
                      <p className="text-xs text-slate-400">{completedCount}/{MODULES.length} modules done</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {MODULES.map(m => {
                      const mp = tp.find(p => p.module_id === m.id);
                      const status = mp?.status ?? 'not_started';
                      return (
                        <div key={m.id} title={`Module ${m.index}: ${m.title.en} — ${status}`}
                          style={{ backgroundColor: statusColor(status) }}
                          className="h-2 w-6 rounded-full transition-all" />
                      );
                    })}
                    <span className="ml-2 text-xs text-slate-400">
                      {curr ? `Playing: Module ${curr.index} — ${curr.title.en}` : completedCount === MODULES.length ? '✓ All done' : 'Not started'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
