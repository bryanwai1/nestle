// app/winner/page.tsx
//
// Live "competition mode" standings screen — projected at the event.
// Wired to useRealtimeLeaderboard, so rows reorder and scores tick up the
// instant any team's score changes (the recalc trigger -> realtime -> here).

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';

const ROW_H = 76;

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setDisplay(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

export default function WinnerPage() {
  const { teams, loading } = useRealtimeLeaderboard();

  const ranked = [...teams].sort(
    (a, b) => b.current_total_score - a.current_total_score || a.team_number - b.team_number
  );
  const rankOf = new Map(ranked.map((t, i) => [t.id, i]));
  const domOrder = [...teams].sort((a, b) => a.team_number - b.team_number);
  const max = Math.max(1, ...teams.map((t) => t.current_total_score));

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#08172E', color: '#fff' }}>
      <style>{`
        @keyframes wbeam1{0%,100%{transform:translate(0,0)}50%{transform:translate(8%,6%)}}
        @keyframes wbeam2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,8%)}}
        @keyframes wpulse{0%{box-shadow:0 0 0 0 rgba(255,45,77,.7)}70%{box-shadow:0 0 0 14px rgba(255,45,77,0)}100%{box-shadow:0 0 0 0 rgba(255,45,77,0)}}
        .wbeam{position:absolute;width:60%;height:200%;top:-50%;filter:blur(80px);opacity:.35;mix-blend-mode:screen;pointer-events:none}
      `}</style>

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 80% -10%,#12356b 0%,#0a1d3a 45%,#08152b 100%)' }} />
      <div className="wbeam" style={{ left: '-10%', background: 'radial-gradient(closest-side,#E4002B,transparent)', animation: 'wbeam1 9s ease-in-out infinite' }} />
      <div className="wbeam" style={{ right: '-10%', background: 'radial-gradient(closest-side,#2a7fff,transparent)', animation: 'wbeam2 11s ease-in-out infinite' }} />

      <main style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 40 }}>🏆</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#9fc0ff' }}>SHE DAY 2026</p>
              <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: -0.5 }}>Live Standings</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 800, letterSpacing: 1.5, background: 'rgba(228,0,43,.18)', border: '1px solid rgba(228,0,43,.5)', padding: '8px 16px', borderRadius: 24 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff2d4d', animation: 'wpulse 1.4s infinite' }} />
            LIVE
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#9bb4d8', padding: '80px 0' }}>Loading standings…</p>
        ) : teams.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9bb4d8', padding: '80px 0' }}>
            No teams yet. Standings appear here as teams register and score.
          </p>
        ) : (
          <div style={{ position: 'relative', height: teams.length * ROW_H }}>
            {domOrder.map((t) => {
              const rank = rankOf.get(t.id) ?? 0;
              const isTop1 = rank === 0, isTop2 = rank === 1, isTop3 = rank === 2;
              const accent = isTop1 ? '#f5a623' : isTop2 ? '#cbd5e1' : isTop3 ? '#e7a878' : '#E4002B';
              return (
                <div
                  key={t.id}
                  style={{
                    position: 'absolute', left: 0, right: 0, height: ROW_H - 10,
                    transform: `translateY(${rank * ROW_H}px)`,
                    transition: 'transform .85s cubic-bezier(.22,.8,.2,1)',
                    display: 'grid', gridTemplateColumns: '56px 1fr 130px', alignItems: 'center', gap: 14,
                    padding: '0 18px', borderRadius: 16,
                    background: isTop1 ? 'linear-gradient(90deg,rgba(245,166,35,.22),rgba(245,166,35,.05))' : 'rgba(255,255,255,.05)',
                    border: `1px solid ${isTop1 ? 'rgba(245,166,35,.6)' : 'rgba(255,255,255,.08)'}`,
                    boxShadow: isTop1 ? '0 0 30px rgba(245,166,35,.25)' : 'none',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, fontWeight: 900, fontSize: 18,
                      background: isTop1 ? 'linear-gradient(135deg,#f5c542,#e09b1a)' : isTop2 ? 'linear-gradient(135deg,#dfe6ef,#aab6c6)' : isTop3 ? 'linear-gradient(135deg,#e7a878,#c47a45)' : 'rgba(255,255,255,.1)',
                      color: isTop1 ? '#3a2600' : isTop2 ? '#27303d' : isTop3 ? '#3a1e0a' : '#cfe0ff',
                    }}
                  >
                    {rank + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Team {t.team_number}
                    </div>
                    <div style={{ fontSize: 12, color: '#9bb4d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.member_1_name}, {t.member_2_name}, {t.member_3_name}
                    </div>
                    <div style={{ position: 'relative', height: 3, marginTop: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round((t.current_total_score / max) * 100)}%`, background: accent, transition: 'width .85s cubic-bezier(.22,.8,.2,1)' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                    <AnimatedScore value={t.current_total_score} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, letterSpacing: 2, color: '#7d97bf', fontWeight: 700 }}>
          COMPETITION MODE · UPDATES IN REAL TIME
        </p>
      </main>
    </div>
  );
}