// app/leaderboard/page.tsx
//
// Standalone projector screen for the live leaderboard (hearts theme).
// Pulls live scores for ALL teams via useRealtimeLeaderboard() and renders
// the full-screen HeartsLeaderboard. Open in a new tab from the admin
// dashboard and cast it to the room screen.
// Also listens for new session_speed_bonus rows and shows a big animated
// notification overlay: "Team X won +10 points — Fastest to complete Module Y!"
'use client';
import { useEffect, useState } from 'react';
import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';
import { HeartsLeaderboard } from '@/components/team/HeartsLeaderboard';
import { createClient } from '@/lib/supabase/client';
import { MODULES } from '@/lib/game/questions';

type BonusNotif = { teamNumber: number; moduleTitle: string; points: number };

export default function LeaderboardScreen() {
  const { teams, loading } = useRealtimeLeaderboard();
  const [notif, setNotif] = useState<BonusNotif | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('speed_bonus_notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_speed_bonus' }, async (payload) => {
        const row = payload.new as { team_id: string; module_id: string; points: number };
        const { data: team } = await supabase.from('teams').select('team_number').eq('id', row.team_id).single();
        const mod = MODULES.find(m => m.id === row.module_id);
        if (team && mod) {
          setNotif({ teamNumber: team.team_number, moduleTitle: mod.title.en, points: row.points });
          setTimeout(() => setNotif(null), 6000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="relative">
      <HeartsLeaderboard teams={teams} loading={loading} />
      {notif && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none">
          <div className="animate-bounce-in mx-4 max-w-lg rounded-3xl border-4 border-yellow-400 bg-[#0B2545] px-10 py-8 text-center shadow-2xl shadow-yellow-400/30">
            <div className="text-5xl mb-3">⚡🏆</div>
            <p className="text-yellow-400 text-lg font-black uppercase tracking-widest">Speed Bonus!</p>
            <p className="text-white text-3xl font-black mt-1">Team {notif.teamNumber}</p>
            <p className="text-slate-300 text-base mt-1">Fastest to complete</p>
            <p className="text-white font-bold text-lg">{notif.moduleTitle}</p>
            <div className="mt-4 rounded-2xl bg-yellow-400 px-6 py-3">
              <p className="text-[#0B2545] text-4xl font-black">+{notif.points} pts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
