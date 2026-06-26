// components/team/SnakeLeaderboard.tsx
//
// Full-screen projector view of the live leaderboard, drawn as racing snakes.
// Length = score, the leader wears the crown, snakes smoothly grow and overtake
// as real scores update. Reads live data via props (teams from
// useRealtimeLeaderboard) — no fake/simulated data. Purely a presentation layer;
// it never writes anything.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type LiveTeam = { id: string; team_number: number; current_total_score: number };

const PALETTE: [string, string][] = [
  ['#ff2d55', '#ff8fa3'], ['#ffb300', '#ffe082'], ['#00d68f', '#7bf5c8'],
  ['#2f8bff', '#9cc9ff'], ['#a55eea', '#d6b3f5'], ['#19c6c6', '#8ff0ef'],
  ['#ff6b35', '#ffc1a8'], ['#5c6bff', '#b3bcff'],
];
const MEDALS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

type Snake = {
  id: string; name: string; color: [string, string];
  target: number; disp: number; laneY: number; targetY: number;
  rank: number; headX: number; headY: number; phase: number; seen: boolean;
};

export function SnakeLeaderboard({ teams, loading }: { teams: LiveTeam[]; loading: boolean }) {
  const { tx } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const teamsRef = useRef<LiveTeam[]>(teams);
  const [sfxOn, setSfxOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const sfxRef = useRef(false);
  const musicRef = useRef(false);
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { sfxRef.current = sfxOn; }, [sfxOn]);
  useEffect(() => { musicRef.current = musicOn; }, [musicOn]);

  // ---- audio (synthesized; unlocked on first user gesture) ----
  const acRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);
  function audio() {
    if (!acRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      acRef.current = new AC();
      masterRef.current = acRef.current.createGain();
      masterRef.current.gain.value = 0.5;
      masterRef.current.connect(acRef.current.destination);
    }
    if (acRef.current.state === 'suspended') acRef.current.resume();
    return acRef.current;
  }
  function tone(freq: number, dur: number, type: OscillatorType = 'triangle', vol = 0.25, when = 0) {
    const ac = audio(); const t0 = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(masterRef.current!); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  const sfxPop = () => { if (sfxRef.current) tone(420 + Math.random() * 480, 0.13, 'triangle', 0.22); };
  const sfxFanfare = () => { if (sfxRef.current) [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'square', 0.2, i * 0.1)); };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = 0, H = 0, DPR = 1, raf = 0, t = 0;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.clientWidth; H = canvas!.clientHeight;
      canvas!.width = W * DPR; canvas!.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const snakes = new Map<string, Snake>();
    let colorI = 0;
    let leaderId: string | null = null;
    const confetti: { x: number; y: number; vx: number; vy: number; rot: number; vr: number; color: string; size: number; life: number }[] = [];
    const floats: { x: number; y: number; vy: number; life: number; text: string; color: string }[] = [];
    const sparkles: { x: number; y: number; life: number; size: number }[] = [];
    const bokeh = Array.from({ length: 18 }, () => ({ x: Math.random() * 1600, y: Math.random() * 900, r: 60 + Math.random() * 160, dx: (Math.random() - .5) * .25, dy: (Math.random() - .5) * .25, hue: Math.random() * 360 }));

    const TOP = 96, BOTTOM = 56, LEFT = 150, RIGHT_PAD = 230, SEG = 9, MIN_LEN = 130;

    function reconcile() {
      const live = teamsRef.current || [];
      const ids = new Set(live.map((x) => x.id));
      for (const id of Array.from(snakes.keys())) if (!ids.has(id)) snakes.delete(id);
      live.forEach((teamRow) => {
        let s = snakes.get(teamRow.id);
        const name = 'Team ' + teamRow.team_number;
        if (!s) {
          s = { id: teamRow.id, name, color: PALETTE[colorI++ % PALETTE.length], target: teamRow.current_total_score, disp: teamRow.current_total_score, laneY: 0, targetY: 0, rank: 0, headX: 0, headY: 0, phase: Math.random() * Math.PI * 2, seen: false };
          snakes.set(teamRow.id, s);
        } else {
          s.name = name;
          if (teamRow.current_total_score > s.target && s.seen) {
            const d = teamRow.current_total_score - s.target;
            if (s.headX) { floats.push({ x: s.headX, y: s.headY - 22, vy: -0.8, life: 1, text: '+' + d, color: s.color[0] }); sfxPop(); }
          }
          s.target = teamRow.current_total_score;
        }
      });
    }

    function stroke(pts: number[][]) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
    function roundRect(x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function drawBG() {
      ctx.fillStyle = '#07152b'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      bokeh.forEach((b) => {
        b.x += b.dx; b.y += b.dy; b.hue += 0.1;
        if (b.x < -200) b.x = W + 200; if (b.x > W + 200) b.x = -200;
        if (b.y < -200) b.y = H + 200; if (b.y > H + 200) b.y = -200;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.hue},70%,55%,0.10)`); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
      });
      ctx.restore();
    }

    function drawSnake(s: Snake, laneH: number, maxScore: number, maxLenPx: number) {
      const lenPx = MIN_LEN + (maxLenPx - MIN_LEN) * (s.disp / maxScore);
      const segCount = Math.max(6, Math.round(lenPx / SEG));
      const amp = Math.min(laneH * 0.12, 13);
      const pts: number[][] = [];
      for (let i = 0; i <= segCount; i++) {
        const x = LEFT + i * SEG;
        const wave = Math.sin(i * 0.26 - t * 3.0 + s.phase) * amp * Math.min(1, i / 7);
        pts.push([x, s.laneY + wave]);
      }
      const head = pts[pts.length - 1]; s.headX = head[0]; s.headY = head[1];

      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save(); ctx.shadowColor = s.color[0]; ctx.shadowBlur = 22; ctx.globalAlpha = 0.5;
      ctx.strokeStyle = s.color[0]; ctx.lineWidth = 22; stroke(pts); ctx.restore();
      const g = ctx.createLinearGradient(pts[0][0], 0, head[0], 0);
      g.addColorStop(0, s.color[0]); g.addColorStop(1, s.color[1]);
      ctx.strokeStyle = g; ctx.lineWidth = 18; stroke(pts);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - 4) : ctx.moveTo(p[0], p[1] - 4)); ctx.stroke();

      const hx = head[0], hy = head[1], hr = 16;
      const hg = ctx.createRadialGradient(hx - 5, hy - 6, 2, hx, hy, hr);
      hg.addColorStop(0, s.color[1]); hg.addColorStop(1, s.color[0]);
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(hx + 5, hy - 6, 4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 5, hy + 6, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#0b2545';
      ctx.beginPath(); ctx.arc(hx + 6.4, hy - 6, 1.9, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 6.4, hy + 6, 1.9, 0, 7); ctx.fill();
      if (Math.sin(t * 3 + s.phase) > 0.55) {
        ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx + hr, hy); ctx.lineTo(hx + hr + 11, hy - 4);
        ctx.moveTo(hx + hr + 6, hy - 1.5); ctx.lineTo(hx + hr + 12, hy + 4); ctx.stroke();
      }
      if (s.rank === 0) {
        const pulse = 1 + Math.sin(t * 4) * 0.08;
        ctx.save(); ctx.translate(hx, hy - hr - 12); ctx.scale(pulse, pulse);
        ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.fillText('\uD83D\uDC51', 0, 0); ctx.restore();
        if (Math.random() < 0.3) sparkles.push({ x: hx + (Math.random() - .5) * 50, y: hy - hr - 18 + (Math.random() - .5) * 24, life: 1, size: 2 + Math.random() * 3 });
      }

      ctx.font = '700 16px system-ui'; const lw = ctx.measureText(s.name).width;
      const medal = s.rank < 3 ? MEDALS[s.rank] + ' ' : '';
      const scoreTxt = medal + Math.round(s.disp) + ' pts';
      ctx.font = '700 12px system-ui'; const sw = ctx.measureText(scoreTxt).width;
      const pillW = Math.max(lw, sw) + 30, pillH = 40, px = hx + hr + 14, py = hy - pillH / 2;
      roundRect(px, py, pillW, pillH, 12); ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fill();
      ctx.fillStyle = s.color[0]; ctx.beginPath(); ctx.arc(px + 14, hy, 9.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(s.rank + 1), px + 14, hy + .5);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#0b2545'; ctx.font = '700 16px system-ui'; ctx.fillText(s.name, px + 28, hy - 2);
      ctx.fillStyle = '#e4002b'; ctx.font = '700 12px system-ui'; ctx.fillText(scoreTxt, px + 28, hy + 13);
    }

    function effects() {
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i]; c.x += c.vx; c.y += c.vy; c.vy += 0.12; c.rot += c.vr; c.life -= 0.012;
        if (c.life <= 0) { confetti.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, c.life); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.fillStyle = c.color; ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6); ctx.restore();
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i]; f.y += f.vy; f.life -= 0.018;
        if (f.life <= 0) { floats.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.color; ctx.font = '800 20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y); ctx.restore();
      }
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i]; sp.life -= 0.04;
        if (sp.life <= 0) { sparkles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, sp.life); ctx.fillStyle = '#ffe082';
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, 7); ctx.fill(); ctx.restore();
      }
    }

    function loop() {
      t += 0.016;
      reconcile();
      drawBG();

      const list = Array.from(snakes.values());
      const n = list.length;
      if (n > 0) {
        const usable = H - TOP - BOTTOM, laneH = usable / n;
        const ranked = [...list].sort((a, b) => b.disp - a.disp);
        ranked.forEach((s, rank) => { s.rank = rank; s.targetY = TOP + laneH * rank + laneH / 2; if (s.laneY === 0) s.laneY = s.targetY; });
        const maxScore = Math.max(50, ...list.map((s) => s.disp));
        const maxLenPx = W - LEFT - RIGHT_PAD;
        list.forEach((s) => { s.disp += (s.target - s.disp) * 0.06; s.laneY += (s.targetY - s.laneY) * 0.08; s.seen = true; });

        const leader = ranked[0];
        if (leaderId === null) leaderId = leader.id;
        else if (leader.id !== leaderId) {
          leaderId = leader.id; sfxFanfare();
          const lx = leader.headX || W / 2, ly = leader.headY || H / 2;
          for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6; confetti.push({ x: lx, y: ly, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, color: `hsl(${Math.random() * 360},90%,60%)`, size: 5 + Math.random() * 6, life: 1 }); }
        }

        [...list].sort((a, b) => a.disp - b.disp).forEach((s) => drawSnake(s, laneH, maxScore, maxLenPx));
      }
      effects();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (musicTimerRef.current) window.clearInterval(musicTimerRef.current);
      acRef.current?.close().catch(() => {});
      acRef.current = null;
    };
  }, []);

  function toggleMusic() {
    const next = !musicOn; setMusicOn(next);
    if (next) {
      audio();
      const SCALE = [392, 440, 523, 587, 659, 784, 880];
      musicTimerRef.current = window.setInterval(() => {
        if (!musicRef.current) return;
        const nn = SCALE[(musicStepRef.current * 2 + (musicStepRef.current % 3)) % SCALE.length];
        tone(nn, 0.5, 'sine', 0.06); tone(nn / 2, 0.6, 'sine', 0.05); musicStepRef.current++;
      }, 420);
    } else if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current); musicTimerRef.current = null;
    }
  }
  function fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }

  const empty = !loading && (teams?.length ?? 0) === 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#07152b] text-white">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 items-center rounded-lg bg-white px-3 text-[15px] font-black text-[#0b2545]">Nestl&eacute;</span>
          <h1 className="text-[22px] font-extrabold drop-shadow">
            {tx({ en: 'SHE Day Live Leaderboard', bm: 'Papan Pendahulu SHE Day' })} 🐍
          </h1>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <button onClick={() => { setSfxOn((v) => { const n = !v; if (n) audio(); return n; }); }} className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${sfxOn ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-white/12 hover:bg-white/20'}`}>{sfxOn ? '🔊 Sound' : '🔇 Muted'}</button>
          <button onClick={toggleMusic} className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${musicOn ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-white/12 hover:bg-white/20'}`}>{musicOn ? '🎵 Music On' : '🎵 Music'}</button>
          <button onClick={fullscreen} className="rounded-xl bg-white/12 px-3.5 py-2 text-sm font-bold transition hover:bg-white/20">⛶ Fullscreen</button>
          <Link href="/" className="rounded-xl bg-white/12 px-3.5 py-2 text-sm font-bold transition hover:bg-white/20">✕ Exit</Link>
        </div>
      </header>

      <canvas ref={canvasRef} className="h-full w-full" />

      {(loading || empty) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-3 text-5xl">🐍</div>
          <p className="text-lg font-semibold text-white/80">
            {loading ? tx({ en: 'Loading scores…', bm: 'Memuatkan markah…' }) : tx({ en: 'Waiting for the first scores…', bm: 'Menunggu markah pertama…' })}
          </p>
        </div>
      )}

      <footer className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-white/40">
        {tx({ en: 'Longest snake leads · 👑 winner · live top 5', bm: 'Ular terpanjang mendahului · 👑 juara · 5 teratas langsung' })}
      </footer>
    </div>
  );
}
