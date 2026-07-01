// components/team/HeartsLeaderboard.tsx
//
// Full-screen projector view of the live leaderboard, drawn as rows of hearts.
// Each team is a row: name on the left, then a row of hearts that grows with
// score (≈ 1 heart per 10 pts, last heart fills partially). Most hearts = the
// leader, who wears the crown. Reads live data via props (teams from
// useRealtimeLeaderboard) — no fake data. Pure presentation; never writes.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type LiveTeam = { id: string; team_number: number; current_total_score: number };

const MEDALS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
const PTS_PER_HEART = 10;

// Unique colour per team via golden-angle hue spacing.
function colorFor(i: number): { main: string; glow: string } {
  const hue = (i * 137.508 + 8) % 360;
  return { main: `hsl(${hue}, 85%, 63%)`, glow: `hsl(${hue}, 90%, 58%)` };
}

type Heart = {
  id: string; name: string; ci: number;
  target: number; disp: number; laneY: number; targetY: number;
  rank: number; endX: number; endY: number; seen: boolean;
};

export function HeartsLeaderboard({ teams, loading }: { teams: LiveTeam[]; loading: boolean }) {
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
  const sfxPop = () => { if (sfxRef.current) tone(520 + Math.random() * 360, 0.12, 'sine', 0.22); };
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

    const hearts = new Map<string, Heart>();
    let colorI = 0;
    let leaderId: string | null = null;
    const confetti: { x: number; y: number; vx: number; vy: number; rot: number; vr: number; color: string; size: number; life: number }[] = [];
    const floats: { x: number; y: number; vy: number; life: number; text: string; color: string }[] = [];
    const bgHearts = Array.from({ length: 16 }, () => ({
      x: Math.random() * 1600, y: Math.random() * 900, s: 14 + Math.random() * 30,
      vy: 0.15 + Math.random() * 0.35, sway: Math.random() * Math.PI * 2, hue: (Math.random() * 40 + 340) % 360,
    }));

    const TOP = 112, BOTTOM = 54, LEFT = 44, RIGHTPAD = 130;

    function heartPath(x: number, yTop: number, s: number) {
      const w = s, h = s * 0.9, tch = h * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, yTop + tch);
      ctx.bezierCurveTo(x, yTop, x - w / 2, yTop, x - w / 2, yTop + tch);
      ctx.bezierCurveTo(x - w / 2, yTop + (h + tch) / 2, x, yTop + (h + tch) / 2, x, yTop + h);
      ctx.bezierCurveTo(x, yTop + (h + tch) / 2, x + w / 2, yTop + (h + tch) / 2, x + w / 2, yTop + tch);
      ctx.bezierCurveTo(x + w / 2, yTop, x, yTop, x, yTop + tch);
      ctx.closePath();
    }
    function drawHeart(cx: number, cy: number, s: number, fill: string, alpha: number, glow?: string) {
      ctx.save();
      ctx.globalAlpha = alpha;
      if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = s * 0.45; }
      heartPath(cx, cy - s * 0.45, s);
      ctx.fillStyle = fill; ctx.fill();
      ctx.restore();
      // gloss
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.ellipse(cx - s * 0.16, cy - s * 0.18, s * 0.12, s * 0.07, -0.5, 0, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      ctx.restore();
    }
    function strokeHeart(cx: number, cy: number, s: number, color: string, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      heartPath(cx, cy - s * 0.45, s);
      ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();
      ctx.restore();
    }
    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    function reconcile() {
      const live = teamsRef.current || [];
      const ids = new Set(live.map((x) => x.id));
      for (const id of Array.from(hearts.keys())) if (!ids.has(id)) hearts.delete(id);
      live.forEach((row) => {
        let s = hearts.get(row.id);
        const name = 'Team ' + row.team_number;
        if (!s) {
          s = { id: row.id, name, ci: colorI++, target: row.current_total_score, disp: row.current_total_score, laneY: 0, targetY: 0, rank: 0, endX: 0, endY: 0, seen: false };
          hearts.set(row.id, s);
        } else {
          s.name = name;
          if (row.current_total_score > s.target && s.seen) {
            const d = row.current_total_score - s.target;
            if (s.endX) { floats.push({ x: s.endX + 24, y: s.endY - 10, vy: -0.8, life: 1, text: '+' + d, color: colorFor(s.ci).main }); sfxPop(); }
          }
          s.target = row.current_total_score;
        }
      });
    }

    function drawBG() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0c2150'); g.addColorStop(0.55, '#0a1838'); g.addColorStop(1, '#07112a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // soft red glow vignette near top
      const rg = ctx.createRadialGradient(W / 2, -80, 40, W / 2, -80, W * 0.7);
      rg.addColorStop(0, 'rgba(228,0,43,0.18)'); rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      // drifting background hearts
      bgHearts.forEach((b) => {
        b.y -= b.vy; b.sway += 0.01;
        if (b.y < -40) { b.y = H + 40; b.x = Math.random() * W; }
        const x = b.x + Math.sin(b.sway) * 18;
        ctx.save(); ctx.globalAlpha = 0.06;
        heartPath(x, b.y, b.s);
        ctx.fillStyle = `hsl(${b.hue},80%,70%)`; ctx.fill();
        ctx.restore();
      });
    }

    function drawRow(s: Heart, laneH: number, heartUnit: number, heartsStartX: number) {
      const sc = Math.max(0.5, Math.min(1.2, laneH / 84));
      const cy = s.laneY;
      const col = colorFor(s.ci);

      // name pill
      ctx.font = `800 ${Math.round(17 * sc)}px system-ui`;
      const tw = ctx.measureText(s.name).width;
      const pillH = Math.min(laneH * 0.62, 44), pillW = tw + 54 * sc;
      const px = LEFT, py = cy - pillH / 2;
      roundRect(px, py, pillW, pillH, pillH / 2);
      ctx.fillStyle = col.main; ctx.fill();
      // rank badge inside pill
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath(); ctx.arc(px + pillH / 2, cy, pillH * 0.32, 0, 7); ctx.fill();
      ctx.fillStyle = col.main; ctx.font = `800 ${Math.round(13 * sc)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(s.rank + 1), px + pillH / 2, cy + 0.5);
      // name
      ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(17 * sc)}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText(s.name, px + pillH * 0.78, cy + 0.5);
      ctx.textBaseline = 'alphabetic';

      // hearts
      const hf = s.disp / PTS_PER_HEART;        // continuous heart count
      const full = Math.floor(hf);
      const frac = hf - full;
      const adv = heartUnit * 1.12;
      let hx = heartsStartX + heartUnit * 0.5;
      if (s.disp <= 0) {
        strokeHeart(hx, cy, heartUnit, 'rgba(255,255,255,0.4)', 0.6);
        hx += adv;
      } else {
        for (let i = 0; i < full; i++) {
          drawHeart(hx, cy, heartUnit, col.main, 1, col.glow);
          hx += adv;
        }
        if (frac > 0.02) {
          const sz = heartUnit * (0.45 + 0.55 * frac);
          drawHeart(hx, cy, sz, col.main, Math.max(0.35, frac), col.glow);
          hx += adv;
        }
      }
      s.endX = hx - adv + heartUnit * 0.5;
      s.endY = cy;

      // score number
      ctx.font = `800 ${Math.round(16 * sc)}px system-ui`;
      ctx.fillStyle = col.main; ctx.textAlign = 'left';
      const scoreTxt = Math.round(s.disp) + ' pts';
      const sx = Math.min(s.endX + 14, W - RIGHTPAD + 8);
      // medal / crown
      if (s.rank === 0) {
        const pulse = 1 + Math.sin(t * 4) * 0.08;
        ctx.save(); ctx.translate(sx + 8, cy); ctx.scale(pulse, pulse);
        ctx.font = `${Math.round(22 * sc)}px serif`; ctx.textAlign = 'center';
        ctx.fillText('\uD83D\uDC51', 0, -2); ctx.restore();
        ctx.textAlign = 'left';
        ctx.font = `800 ${Math.round(16 * sc)}px system-ui`; ctx.fillStyle = col.main;
        ctx.fillText(scoreTxt, sx + 24, cy + 5);
      } else {
        const medal = s.rank < 3 ? MEDALS[s.rank] + ' ' : '';
        ctx.fillText(medal + scoreTxt, sx, cy + 5);
      }
    }

    function effects() {
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i]; c.x += c.vx; c.y += c.vy; c.vy += 0.12; c.rot += c.vr; c.life -= 0.012;
        if (c.life <= 0) { confetti.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, c.life); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.fillStyle = c.color; ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6); ctx.restore();
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i]; f.y += f.vy; f.life -= 0.016;
        if (f.life <= 0) { floats.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.color;
        ctx.font = '800 22px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y); ctx.restore();
      }
    }

    function loop() {
      t += 0.016;
      reconcile();
      drawBG();

      const list = Array.from(hearts.values());
      const n = list.length;
      if (n > 0) {
        const usable = H - TOP - BOTTOM;
        const laneH = Math.min(usable / n, 132);
        const blockTop = TOP + Math.max(0, (usable - laneH * n) / 2);
        const ranked = [...list].sort((a, b) => b.disp - a.disp);
        ranked.forEach((s, rank) => { s.rank = rank; s.targetY = blockTop + laneH * rank + laneH / 2; if (s.laneY === 0) s.laneY = s.targetY; });
        list.forEach((s) => { s.disp += (s.target - s.disp) * 0.06; s.laneY += (s.targetY - s.laneY) * 0.09; s.seen = true; });

        // size hearts so the leader's row fits the width
        const maxName = 210;
        const heartsStartX = LEFT + maxName + 16;
        const heartsAreaW = W - heartsStartX - RIGHTPAD;
        const maxHF = Math.max(1, ...list.map((s) => s.disp / PTS_PER_HEART));
        let heartUnit = heartsAreaW / (maxHF * 1.12);
        heartUnit = Math.max(8, Math.min(heartUnit, laneH * 0.6, 36));

        // leader change celebration
        const leader = ranked[0];
        if (leaderId === null) leaderId = leader.id;
        else if (leader.id !== leaderId) {
          leaderId = leader.id; sfxFanfare();
          const lx = leader.endX || W / 2, ly = leader.endY || H / 2;
          for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6; confetti.push({ x: lx, y: ly, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, color: `hsl(${Math.random() * 360},90%,62%)`, size: 5 + Math.random() * 6, life: 1 }); }
        }

        ranked.forEach((s) => drawRow(s, laneH, heartUnit, heartsStartX));
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
    <div className="fixed inset-0 z-50 bg-[#07112a] text-white">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 items-center rounded-lg bg-white px-3 text-[15px] font-black text-[#0b2545]">Nestl&eacute;</span>
          <h1 className="text-[22px] font-extrabold drop-shadow">
            {tx({ en: 'SHE Day Live Leaderboard', bm: 'Papan Pendahulu SHE Day' })} &#10084;&#65039;
          </h1>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <button onClick={() => { setSfxOn((v) => { const n = !v; if (n) audio(); return n; }); }} className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${sfxOn ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-white/12 hover:bg-white/20'}`}>{sfxOn ? '\uD83D\uDD0A Sound' : '\uD83D\uDD07 Muted'}</button>
          <button onClick={toggleMusic} className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${musicOn ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-white/12 hover:bg-white/20'}`}>{musicOn ? '\uD83C\uDFB5 Music On' : '\uD83C\uDFB5 Music'}</button>
          <button onClick={fullscreen} className="rounded-xl bg-white/12 px-3.5 py-2 text-sm font-bold transition hover:bg-white/20">&#9974; Fullscreen</button>
          <Link href="/" className="rounded-xl bg-white/12 px-3.5 py-2 text-sm font-bold transition hover:bg-white/20">&#10005; Exit</Link>
        </div>
      </header>

      <canvas ref={canvasRef} className="h-full w-full" />

      {(loading || empty) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-3 text-5xl">&#10084;&#65039;</div>
          <p className="text-lg font-semibold text-white/80">
            {loading ? tx({ en: 'Loading scores\u2026', bm: 'Memuatkan markah\u2026' }) : tx({ en: 'Waiting for the first scores\u2026', bm: 'Menunggu markah pertama\u2026' })}
          </p>
        </div>
      )}

      <footer className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-white/40">
        {tx({ en: 'Most hearts leads \u00b7 \uD83D\uDC51 winner \u00b7 live \u00b7 each \u2764\uFE0F \u2248 10 pts', bm: 'Paling banyak hati mendahului \u00b7 \uD83D\uDC51 juara \u00b7 langsung \u00b7 setiap \u2764\uFE0F \u2248 10 mata' })}
      </footer>
    </div>
  );
}
