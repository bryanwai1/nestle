// app/admin/teams/page.tsx — Live team tracker with countdown timers
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES } from '@/lib/game/questions';
import Link from 'next/link';

type Team = { id: string; team_number: number; member_1_name: string; member_2_name: string; member_3_name: string; member_4_name?: string; current_total_score: number; region?: string };
type Progress = { team_id: string; module_id: string; status: string; started_at: string };
type Bonus = { team_id: string; module_id: string; points: number };

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

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  return now;
}

function formatTime(secs: number) {
  if (secs <= 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function TeamsTrackerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const now = useNow();
  const supabase = createClient();

  async function load() {
    const [{ data: t }, { data: p }, { data: b }] = await Promise.all([
      (supabase as any).from('teams').select('id,team_number,member_1_name,member_2_name,member_3_name,member_4_name,current_total_score,region').order('current_total_score', { ascending: false }),
      (supabase as any).from('team_module_progress').select('team_id,module_id,status,started_at'),
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

  function getTimer(teamId: string) {
    const inProg = progress.find(p => p.team_id === teamId && p.status === 'in_progress');
    if (!inProg) return null;
    const duration = MODULE_TIMERS[inProg.module_id] ?? 600;
    const elapsed = Math.floor((now - new Date(inProg.started_at).getTime()) / 1000);
    const remaining = duration - elapsed;
    const mod = MODULES.find(m => m.id === inProg.module_id);
    return { remaining, moduleTitle: mod?.title.en ?? inProg.module_id, isLow: remaining < 60, isDone: remaining <= 0 };
  }

  return (
    <div className="min-h-screen bg-[#070f1f] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Live Team Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">{teams.length} teams · live timers</p>
          </div>
          <Link href="/admin/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5">← Dashboard</Link>
        </div>
        <div className="space-y-3">
          {teams.map((team, idx) => {
            const tp = progress.filter(p => p.team_id === team.id);
            const tb = bonuses.filter(b => b.team_id === team.id);
            const timer = getTimer(team.id);
            const completedCount = tp.filter(p => p.status === 'completed').length;
            const members = [team.member_1_name, team.member_2_name, team.member_3_name, team.member_4_name].filter(Boolean);
            return (
              <div key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4002B] text-sm font-black">#{idx+1}</span>
                    <div>
                      <p className="font-bold text-white">Team {team.team_number}</p>
                      <p className="text-xs text-slate-400">{members.join(' · ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {timer && (
                      <div className={`rounded-xl px-4 py-2 text-center ${timer.isDone ? 'bg-red-900/50 border border-red-500' : timer.isLow ? 'bg-red-500/20 border border-red-400' : 'bg-white/10'}`}>
                        <p className="text-xs text-slate-400">{timer.moduleTitle}</p>
                        <p className={`text-2xl font-black tabular-nums ${timer.isDone ? 'text-red-400' : timer.isLow ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                          {timer.isDone ? 'TIME UP' : formatTime(timer.remaining)}
                        </p>
                      </div>
                    )}
                    {!timer && completedCount === MODULES.length && (
                      <span className="rounded-xl bg-emerald-600/20 border border-emerald-500 px-4 py-2 text-sm font-bold text-emerald-400">✓ All done</span>
                    )}
                    <div className="text-right">
                      {tb.length > 0 && <p className="text-xs text-yellow-400 font-bold">⚡ {tb.length}× speed</p>}
                      <p className="text-2xl font-black text-white">{team.current_total_score} pts</p>
                      <p className="text-xs text-slate-400">{completedCount}/{MODULES.length} modules</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 flex-wrap">
                  {MODULES.map(m => {
                    const mp = tp.find(p => p.module_id === m.id);
                    const status = mp?.status ?? 'not_started';
                    const color = status === 'completed' ? '#10b981' : status === 'in_progress' ? '#f59e0b' : '#334155';
                    return <div key={m.id} title={`Module ${m.index}: ${m.title.en}`} style={{ backgroundColor: color }} className="h-2 w-6 rounded-full transition-all" />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
