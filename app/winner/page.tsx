// app/winner/page.tsx
//
// Full-screen celebration screen — intended to be opened by the admin on a
// projector while teams watch. Pulls real-time scores from Supabase,
// animates a podium reveal, plays a synthesized victory fanfare, and rains
// confetti. No auth required — it's a read-only display surface.

'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Team {
  id: string;
  team_number: number;
  member_1_name: string;
  member_2_name: string;
  member_3_name: string;
  current_total_score: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Web Audio victory fanfare — pure synthesis, no external files needed
// ──────────────────────────────────────────────────────────────────────────
function playFanfare() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const notes = [
      // note frequency, start-time, duration
      [523.25, 0.0, 0.15],   // C5
      [659.25, 0.15, 0.15],  // E5
      [783.99, 0.30, 0.15],  // G5
      [1046.5, 0.45, 0.40],  // C6
      [783.99, 0.85, 0.15],  // G5
      [1046.5, 1.00, 0.60],  // C6 hold
    ] as [number, number, number][];

    notes.forEach(([freq, start, dur]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.01);
    });
  } catch {
    // Audio not available (SSR / user gesture not met)
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Confetti particle system (pure CSS via inline style generation)
// ──────────────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#E4002B', '#0B2545', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'];

function ConfettiLayer({ count = 100 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(var(--rot)); opacity: 1; }
          100% { transform: translateY(110vh) rotate(calc(var(--rot) + 720deg)); opacity: 0.2; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animation: `confetti-fall ${p.duration} ${p.delay} linear infinite`,
            '--rot': p.rotate,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Podium bar heights  (1st = tallest)
// ──────────────────────────────────────────────────────────────────────────
const PODIUM_HEIGHTS = ['h-40', 'h-28', 'h-20'];
const PODIUM_MEDALS  = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS  = [
  'from-yellow-400 to-yellow-600 ring-yellow-300',
  'from-slate-300 to-slate-500 ring-slate-200',
  'from-orange-400 to-orange-600 ring-orange-300',
];
// Reorder so podium order is 2nd, 1st, 3rd (classic podium layout)
const PODIUM_DISPLAY_ORDER = [1, 0, 2]; // indices into top-3 array

export default function WinnerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const fanfireRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('current_total_score', { ascending: false })
        .limit(3);
      setTeams((data as Team[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('winner-leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function handleReveal() {
    setRevealed(true);
    if (!fanfireRef.current) {
      fanfireRef.current = true;
      playFanfare();
    }
  }

  const top3 = teams.slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B2545]">
      {/* Stars background */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {revealed && <ConfettiLayer count={120} />}

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-end px-4 pb-0 pt-12">
        {/* Title */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E4002B]">
            🏆 2026 Nestlé SHE Day Challenge
          </p>
          <h1
            className="mt-2 text-4xl font-black text-white transition-all duration-700 sm:text-6xl"
            style={{ textShadow: '0 0 40px rgba(228,0,43,0.5)' }}
          >
            {loading ? 'Loading…' : 'WINNERS'}
          </h1>
        </div>

        {loading ? (
          <p className="mb-20 text-white/60">Fetching results…</p>
        ) : !revealed ? (
          <button
            type="button"
            onClick={handleReveal}
            className="mb-32 animate-bounce rounded-2xl bg-[#E4002B] px-10 py-5 text-xl font-black text-white shadow-lg shadow-red-900 transition hover:scale-105"
          >
            🎉 Reveal the Winners!
          </button>
        ) : (
          <>
            {/* Podium */}
            <div className="flex w-full max-w-2xl items-end justify-center gap-3">
              {PODIUM_DISPLAY_ORDER.map((teamIdx, displayPos) => {
                const team = top3[teamIdx];
                if (!team) return <div key={displayPos} className="flex-1" />;
                const height = PODIUM_HEIGHTS[displayPos === 1 ? 0 : displayPos === 0 ? 1 : 2];
                const colors = PODIUM_COLORS[displayPos === 1 ? 0 : displayPos === 0 ? 1 : 2];
                const medal  = PODIUM_MEDALS[displayPos === 1 ? 0 : displayPos === 0 ? 1 : 2];
                const rank   = displayPos === 1 ? 1 : displayPos === 0 ? 2 : 3;

                return (
                  <div key={team.id}
                    className="flex flex-1 animate-[slideUp_0.8s_ease-out_forwards] flex-col items-center"
                    style={{ animationDelay: `${displayPos * 0.25}s`, opacity: 0, '--tw-translate-y': '100px' } as React.CSSProperties}
                  >
                    {/* Team card above podium */}
                    <div className={`mb-2 w-full rounded-2xl bg-white/10 p-3 text-center backdrop-blur ring-2 ${colors.split(' ').pop()}`}>
                      <div className="text-3xl">{medal}</div>
                      <p className="mt-1 text-sm font-black text-white">Team {team.team_number}</p>
                      <p className="text-2xl font-black text-yellow-300 tabular-nums">{team.current_total_score} pts</p>
                      <p className="mt-1 text-[10px] text-white/60 leading-tight">
                        {team.member_1_name}<br />{team.member_2_name}<br />{team.member_3_name}
                      </p>
                    </div>
                    {/* Podium block */}
                    <div className={`w-full ${height} rounded-t-xl bg-gradient-to-b ${colors.split(' ').slice(0, 2).join(' ')} ring-2 ${colors.split(' ').pop()} flex items-center justify-center`}>
                      <span className="text-3xl font-black text-white/80">#{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(80px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
            `}</style>

            {/* Floor strip */}
            <div className="h-6 w-full max-w-2xl rounded-t-sm bg-white/10" />

            {/* Replay sound button */}
            <button
              type="button"
              onClick={playFanfare}
              className="my-6 rounded-full bg-white/10 px-5 py-2 text-xs font-medium text-white/60 hover:bg-white/20"
            >
              🔊 Play fanfare again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
