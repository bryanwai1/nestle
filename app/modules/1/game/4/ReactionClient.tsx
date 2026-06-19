// @ts-nocheck
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

/**
 * Reaction Brake Test — Nestlé SHE Day "Safe Driving"
 * A 2D reaction game: a child darts out from behind a parked van.
 * Tap BRAKE in time to stop before the pedestrian.
 *
 * Self-contained. Only depends on React. Drop into Next.js as a Client Component
 * ("use client" at the top) and rename to .tsx if you want types.
 *
 * Optional prop: onComplete(totalScore, details) — called when the run finishes,
 * so you can upsert into your Supabase `scores` table.
 */

// ---- Tunable difficulty (per round) -------------------------------------
// v = world speed (px/s), decel = braking power (px/s^2), gap = reveal distance, kmh = display speed
const ROUNDS = [
  { v: 330, decel: 950, gap: 305, kmh: 45 },
  { v: 385, decel: 980, gap: 285, kmh: 60 },
  { v: 440, decel: 1010, gap: 270, kmh: 80 },
];

// Scene coordinate space (scales automatically via SVG viewBox)
const W = 720;
const H = 380;
const CAR_FRONT = 250; // x of the car's front bumper (camera-fixed)
const PED_CONTACT = 12; // gap (px) at which a collision happens

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export default function ReactionBrakeTest({ onComplete }) {
  // ---- React state drives only overlays / HUD text (not per-frame motion) ----
  const [ui, setUi] = useState("idle"); // idle | playing | result | done
  const [hazard, setHazard] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [roundNum, setRoundNum] = useState(1);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState([]);

  // ---- Mutable game state (no re-render) ----
  const g = useRef({
    phase: "idle",
    v: 0, v0: 0, decel: 0, gap: 560, triggerGap: 300,
    spawned: false, pedStep: 0, walk: 0, dash: 0, wheel: 0,
    skid: 0, t0: 0, reaction: 0, shake: 0, bob: 0,
  }).current;

  // DOM refs (SVG groups we move every frame)
  const refs = {
    scene: useRef(null), car: useRef(null), wheelF: useRef(null), wheelR: useRef(null),
    brake: useRef(null), ped: useRef(null), legL: useRef(null), legR: useRef(null),
    van: useRef(null), dash: useRef(null), sky: useRef(null), skid: useRef(null),
    speed: useRef(null),
  };

  const ri = useRef(0);            // round index
  const results = useRef([]);      // per-round results
  const raf = useRef(0);
  const last = useRef(0);
  const spawnTimer = useRef(null);
  const audio = useRef(null);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // ---- Tiny Web Audio helpers (safe, optional) ----
  const ac = () => {
    if (mutedRef.current) return null;
    try {
      if (!audio.current) audio.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.current.state === "suspended") audio.current.resume();
      return audio.current;
    } catch { return null; }
  };
  const tone = (f0, f1, dur, type = "sawtooth", vol = 0.18) => {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), a.currentTime + dur);
    gn.gain.setValueAtTime(vol, a.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  };
  const sfxScreech = () => tone(700, 180, 0.5, "sawtooth", 0.12);
  const sfxThud = () => tone(150, 50, 0.4, "square", 0.3);
  const sfxDing = () => { tone(660, 660, 0.12, "sine", 0.2); setTimeout(() => tone(990, 990, 0.18, "sine", 0.2), 110); };

  // ---- Round lifecycle ----
  const startRound = useCallback((i) => {
    const cfg = ROUNDS[i];
    g.phase = "ready"; g.v = cfg.v; g.v0 = cfg.v; g.decel = cfg.decel;
    g.gap = 560; g.triggerGap = cfg.gap * rand(0.92, 1.06);
    g.spawned = false; g.pedStep = 0; g.skid = 0; g.reaction = 0; g.walk = 0; g.shake = 0;
    setHazard(false); setOutcome(null); setRoundNum(i + 1); setUi("playing");
    clearTimeout(spawnTimer.current);
    spawnTimer.current = setTimeout(() => { if (g.phase === "ready") g.spawned = true; }, rand(900, 2600));
  }, [g]);

  const endRound = useCallback((type) => {
    if (["safe", "crash", "early"].includes(g.phase)) return;
    g.phase = type === "hit" ? "crash" : type === "early" ? "early" : "safe";
    const reaction = type === "safe" ? Math.round(g.reaction) : null;
    const points = type === "safe" ? Math.max(20, 100 - Math.floor(Math.max(0, reaction - 200) / 4)) : 0;
    results.current.push({ type: g.phase, reaction, points });
    if (g.phase === "crash") { g.shake = 1; sfxThud(); }
    if (g.phase === "safe") sfxDing();
    setScore((s) => s + points);
    setOutcome({ type: g.phase, reaction, points });
    setUi("result");
  }, [g]);

  const onBrake = useCallback(() => {
    if (g.phase === "go") {
      g.reaction = performance.now() - g.t0; g.phase = "braking"; g.skid = 0.0001; sfxScreech();
    } else if (g.phase === "ready") {
      endRound("early"); // jumped the gun
    }
  }, [g, endRound]);

  const next = () => {
    ri.current += 1;
    if (ri.current < ROUNDS.length) startRound(ri.current);
    else {
      const total = results.current.reduce((s, r) => s + r.points, 0);
      setHistory(results.current.slice());
      setUi("done");
      onComplete && onComplete(total, results.current.slice());
    }
  };

  const begin = () => { ac(); ri.current = 0; results.current = []; setScore(0); startRound(0); };
  const replay = () => { results.current = []; ri.current = 0; setScore(0); startRound(0); };

  // ---- Main animation loop (runs once, reads from refs) ----
  useEffect(() => {
    const frame = (now) => {
      const dt = Math.min(0.05, (now - (last.current || now)) / 1000);
      last.current = now;
      const moving = ["ready", "go", "braking"].includes(g.phase);

      if (moving) {
        g.dash += g.v * dt;
        g.wheel += g.v * dt * 0.9;
        g.bob = Math.sin(now / 90) * (g.v / g.v0 || 0) * 1.2;
        if (g.spawned) g.gap -= g.v * dt;
        if (g.phase === "ready" && g.spawned && g.gap <= g.triggerGap) {
          g.phase = "go"; g.t0 = now; setHazard(true);
        }
        if (g.phase === "go" || g.phase === "braking") g.pedStep = Math.min(1, g.pedStep + dt * 4.5);
        if (g.phase === "braking") {
          g.v = Math.max(0, g.v - g.decel * dt);
          g.skid = Math.min(1, g.skid + dt * 2);
        }
        g.walk += dt * (g.phase === "ready" ? 0 : 10);
        if (g.spawned && g.gap <= PED_CONTACT) endRound("hit");
        else if (g.phase === "braking" && g.v <= 0.5) endRound("safe");
      }
      if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 3);

      // ---- write to DOM ----
      const set = (r, t) => r.current && r.current.setAttribute("transform", t);
      const pedX = CAR_FRONT + Math.max(PED_CONTACT, g.gap);
      const sx = g.shake * Math.sin(now / 18) * 6;
      const sy = g.shake * Math.cos(now / 14) * 4;
      set(refs.scene, `translate(${sx} ${sy})`);
      set(refs.car, `translate(0 ${g.bob.toFixed(2)})`);
      set(refs.wheelF, `translate(196 316) rotate(${g.wheel})`);
      set(refs.wheelR, `translate(143 316) rotate(${g.wheel})`);
      set(refs.dash, `translate(${-(g.dash % 70)} 0)`);
      set(refs.sky, `translate(${-((g.dash * 0.18) % 260)} 0)`);
      const stepY = (1 - g.pedStep) * -46;
      const sway = Math.sin(g.walk) * 14;
      set(refs.ped, `translate(${pedX.toFixed(1)} ${stepY.toFixed(1)})`);
      set(refs.van, `translate(${(pedX + 66).toFixed(1)} 0)`);
      set(refs.legL, `rotate(${sway} 0 286)`);
      set(refs.legR, `rotate(${-sway} 0 286)`);
      if (refs.ped.current) refs.ped.current.style.opacity = g.phase === "ready" ? 0 : 1;
      if (refs.van.current) refs.van.current.style.opacity = g.spawned ? 1 : 0;
      if (refs.brake.current) refs.brake.current.style.opacity = g.phase === "braking" ? 1 : 0.15;
      if (refs.skid.current) {
        refs.skid.current.style.opacity = g.skid > 0 ? 0.55 : 0;
        refs.skid.current.setAttribute("width", (g.skid * 70).toFixed(0));
      }
      if (refs.speed.current) {
        const kmh = Math.round((ROUNDS[ri.current]?.kmh || 0) * (g.v / (g.v0 || 1) || 0));
        refs.speed.current.textContent = (moving ? kmh : 0) + " km/h";
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf.current); clearTimeout(spawnTimer.current); };
  }, [g, endRound, refs.brake, refs.car, refs.dash, refs.legL, refs.legR, refs.ped, refs.scene, refs.skid, refs.sky, refs.speed, refs.van, refs.wheelF, refs.wheelR]);

  // ---- prompt text ----
  const prompt =
    ui !== "playing" ? "" :
    hazard ? "BRAKE!" :
    g.spawned ? "Stay sharp…" : "Eyes on the road…";

  const dots = ROUNDS.map((_, i) => i);

  return (
    <div style={S.wrap}>
      <style>{KEYFRAMES}</style>

      {/* Header — matches the Nestlé SHE Day card */}
      <div style={S.header}>
        <div style={S.brandRow}>
          <div style={S.logo}>🚗</div>
          <div>
            <div style={S.brand}>Nestlé</div>
            <div style={S.sub}>SHE DAY 2025</div>
          </div>
          <button style={S.mute} onClick={() => setMuted((m) => !m)} aria-label="sound">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
        <div style={S.titleBar}>
          <div style={S.rx}>RX</div>
          <div style={{ flex: 1 }}>
            <div style={S.gameTitle}>Reaction Brake Test</div>
            <div style={S.gameSub}>Module 1 · Game 4 of 4 · Safe Driving</div>
          </div>
          <div style={S.priority}>PRIORITY 1</div>
        </div>
      </div>

      {/* HUD */}
      <div style={S.hud}>
        <div style={S.hudL}>
          {dots.map((i) => (
            <span key={i} style={{ ...S.dot, background: i < ri.current ? "#2e9e6b" : i === ri.current ? "#d13438" : "#cdd5e3" }} />
          ))}
          <span style={S.round}>Round {roundNum}/{ROUNDS.length}</span>
        </div>
        <div style={S.scoreBox}><span style={S.scoreLbl}>SCORE</span><b style={S.scoreVal}>{score}</b></div>
      </div>

      {/* Prompt */}
      <div style={{ ...S.prompt, color: hazard ? "#d13438" : "#5b6b86", animation: hazard ? "flash .35s steps(2,end) infinite" : "none" }}>
        {prompt || "\u00A0"}
      </div>

      {/* Game scene */}
      <div style={S.stage} onPointerDown={(e) => { e.preventDefault(); if (ui === "playing") onBrake(); }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8ec5ef" /><stop offset="1" stopColor="#dfeefb" />
            </linearGradient>
            <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a4150" /><stop offset="1" stopColor="#2a2f3a" />
            </linearGradient>
            <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f6df0" /><stop offset="1" stopColor="#1b4fc4" />
            </linearGradient>
            <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(0,0,0,.35)" /><stop offset="1" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          <g ref={refs.scene}>
            {/* sky */}
            <rect x="0" y="0" width={W} height="216" fill="url(#sky)" />
            <g ref={refs.sky} opacity="0.85">
              {[0, 260, 520].map((bx) =>
                [40, 120, 190].map((h, i) => (
                  <rect key={bx + "-" + i} x={bx + 30 + i * 70} y={216 - h} width="46" height={h} rx="3" fill="#9fb6d4" opacity={0.5 + i * 0.12} />
                ))
              )}
            </g>
            {/* grass + curb */}
            <rect x="0" y="206" width={W} height="20" fill="#7cb86a" />
            <rect x="0" y="222" width={W} height="6" fill="#e9eef5" />
            {/* road */}
            <rect x="0" y="228" width={W} height="118" fill="url(#road)" />
            <rect x="0" y="340" width={W} height="6" fill="#e9eef5" />
            {/* center dashes */}
            <g ref={refs.dash}>
              {Array.from({ length: 14 }).map((_, i) => (
                <rect key={i} x={i * 70} y="284" width="38" height="7" rx="3" fill="#f2c14e" />
              ))}
            </g>

            {/* skid marks (behind car, grow on brake) */}
            <rect ref={refs.skid} x="110" y="330" width="0" height="6" rx="3" fill="#15171c" opacity="0" transform="scale(-1,1) translate(-180,0)" />

            {/* parked van (hazard cover) */}
            <g ref={refs.van} style={{ transition: "opacity .15s" }}>
              <ellipse cx="0" cy="332" rx="60" ry="9" fill="url(#shadow)" />
              <rect x="-58" y="250" width="116" height="64" rx="9" fill="#c9543b" />
              <rect x="-50" y="258" width="44" height="26" rx="5" fill="#bfe0f2" />
              <rect x="-2" y="258" width="36" height="26" rx="5" fill="#bfe0f2" />
              <circle cx="-34" cy="318" r="13" fill="#1d2128" /><circle cx="-34" cy="318" r="5" fill="#576070" />
              <circle cx="36" cy="318" r="13" fill="#1d2128" /><circle cx="36" cy="318" r="5" fill="#576070" />
            </g>

            {/* pedestrian (child) darts out */}
            <g ref={refs.ped} style={{ transition: "opacity .1s" }}>
              <ellipse cx="0" cy="318" rx="20" ry="6" fill="url(#shadow)" />
              <g ref={refs.legL}><rect x="-7" y="286" width="6" height="22" rx="3" fill="#33405c" /></g>
              <g ref={refs.legR}><rect x="1" y="286" width="6" height="22" rx="3" fill="#2a3550" /></g>
              <rect x="-11" y="262" width="22" height="30" rx="7" fill="#f2c14e" />
              <circle cx="0" cy="250" r="11" fill="#f6caa0" />
              <path d="M-11 248 a11 9 0 0 1 22 0 z" fill="#6b4a2f" />
            </g>

            {/* CAR (camera-fixed) */}
            <g ref={refs.car}>
              <ellipse cx="170" cy="332" rx="78" ry="11" fill="url(#shadow)" />
              <g ref={refs.wheelF}><circle r="16" fill="#15171c" /><circle r="7" fill="#6b7486" /><rect x="-1.5" y="-15" width="3" height="30" fill="#9aa3b4" /><rect x="-15" y="-1.5" width="30" height="3" fill="#9aa3b4" /></g>
              <g ref={refs.wheelR}><circle r="16" fill="#15171c" /><circle r="7" fill="#6b7486" /><rect x="-1.5" y="-15" width="3" height="30" fill="#9aa3b4" /><rect x="-15" y="-1.5" width="30" height="3" fill="#9aa3b4" /></g>
              <path d="M112 312 L112 292 Q112 284 122 282 L150 278 Q160 262 178 261 L210 261 Q224 262 230 280 L242 286 Q250 289 250 300 L250 312 Z" fill="url(#carBody)" />
              <path d="M154 278 Q162 266 176 265 L206 265 Q218 266 224 281 Z" fill="#bfe0f2" />
              <rect x="184" y="266" width="3" height="15" fill="#1b4fc4" />
              <circle cx="246" cy="298" r="4" fill="#ffe89a" />
              {/* brake light */}
              <g ref={refs.brake} style={{ opacity: 0.15 }}>
                <rect x="110" y="290" width="6" height="12" rx="2" fill="#ff3b30" />
                <rect x="104" y="290" width="6" height="12" rx="3" fill="#ff3b30" opacity="0.5" />
              </g>
            </g>
          </g>
        </svg>

        {/* live speedometer chip */}
        <div style={S.speedChip}><span ref={refs.speed}>0 km/h</span></div>

        {/* overlays */}
        {ui === "idle" && (
          <Overlay>
            <div style={S.bigIcon}>🚦</div>
            <h2 style={S.oTitle}>Reaction Brake Test</h2>
            <p style={S.oText}>A child can dart out from behind a parked van. Tap <b>BRAKE</b> the instant you see them. Three rounds — react fast, stop safe.</p>
            <button style={S.btnPrimary} onClick={begin}>Start driving</button>
          </Overlay>
        )}

        {ui === "result" && outcome && (
          <Overlay tint={outcome.type === "safe" ? "rgba(46,158,107,.12)" : "rgba(209,52,56,.12)"}>
            <div style={S.bigIcon}>{outcome.type === "safe" ? "✅" : outcome.type === "early" ? "⏱️" : "💥"}</div>
            <h2 style={{ ...S.oTitle, color: outcome.type === "safe" ? "#2e9e6b" : "#d13438" }}>
              {outcome.type === "safe" ? "Stopped in time!" : outcome.type === "early" ? "Too soon!" : "You hit the pedestrian"}
            </h2>
            {outcome.type === "safe" && <p style={S.reaction}>Reaction <b>{outcome.reaction} ms</b></p>}
            {outcome.type === "early" && <p style={S.oText}>You braked before the hazard appeared. Wait for the danger, then react.</p>}
            {outcome.type === "crash" && <p style={S.oText}>Too slow off the brake. Every fraction of a second counts.</p>}
            <p style={S.points}>+{outcome.points} points</p>
            <button style={S.btnPrimary} onClick={next}>{ri.current < ROUNDS.length - 1 ? "Next round" : "See results"}</button>
          </Overlay>
        )}

        {ui === "done" && (
          <Overlay>
            <div style={S.bigIcon}>{score >= 240 ? "🏆" : score >= 150 ? "🎖️" : "🚸"}</div>
            <h2 style={S.oTitle}>Final score: {score}/300</h2>
            <div style={S.summary}>
              {history.map((r, i) => (
                <div key={i} style={S.summaryRow}>
                  <span>Round {i + 1}</span>
                  <span>{r.type === "safe" ? `${r.reaction} ms` : r.type === "early" ? "Jumped" : "Crashed"}</span>
                  <b style={{ color: r.points ? "#2e9e6b" : "#d13438" }}>{r.points} pts</b>
                </div>
              ))}
            </div>
            <button style={S.btnPrimary} onClick={replay}>Play again</button>
          </Overlay>
        )}
      </div>

      {/* BRAKE button */}
      <button
        style={{ ...S.brakeBtn, opacity: ui === "playing" ? 1 : 0.55, transform: hazard ? "scale(1.02)" : "scale(1)" }}
        onPointerDown={(e) => { e.preventDefault(); if (ui === "playing") onBrake(); }}
        disabled={ui !== "playing"}
      >
        BRAKE
      </button>
    </div>
  );
}

function Overlay({ children, tint }) {
  return (
    <div style={{ ...S.overlay, background: tint || "rgba(255,255,255,.0)" }}>
      <div style={S.card}>{children}</div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes flash { 50% { opacity: .25 } }
@keyframes pop { from { transform: scale(.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
`;

const S = {
  wrap: { fontFamily: "'Rubik', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", color: "#16233f", userSelect: "none", WebkitTapHighlightColor: "transparent" },
  header: { background: "#16233f", borderRadius: "14px 14px 0 0", overflow: "hidden" },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" },
  logo: { width: 34, height: 34, borderRadius: 9, background: "#fff", display: "grid", placeItems: "center", fontSize: 18 },
  brand: { color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1 },
  sub: { color: "#8ea3c7", fontSize: 10, letterSpacing: 1, marginTop: 2 },
  mute: { marginLeft: "auto", background: "rgba(255,255,255,.12)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 14 },
  titleBar: { display: "flex", alignItems: "center", gap: 12, background: "#c1272d", padding: "10px 16px" },
  rx: { width: 30, height: 30, borderRadius: 7, background: "rgba(0,0,0,.18)", color: "#fff", fontWeight: 800, display: "grid", placeItems: "center", fontSize: 13 },
  gameTitle: { color: "#fff", fontWeight: 700, fontSize: 15 },
  gameSub: { color: "rgba(255,255,255,.8)", fontSize: 11 },
  priority: { background: "rgba(0,0,0,.2)", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "4px 8px", borderRadius: 6 },
  hud: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#f3f6fb" },
  hudL: { display: "flex", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 99, display: "inline-block" },
  round: { fontSize: 12, color: "#5b6b86", marginLeft: 6, fontWeight: 600 },
  scoreBox: { display: "flex", alignItems: "baseline", gap: 6 },
  scoreLbl: { fontSize: 10, color: "#8a99b5", letterSpacing: 1, fontWeight: 700 },
  scoreVal: { fontSize: 18, color: "#16233f" },
  prompt: { textAlign: "center", fontWeight: 800, fontSize: 16, letterSpacing: 1, height: 22, padding: "8px 0 4px", background: "#f3f6fb" },
  stage: { position: "relative", background: "#dfeefb", overflow: "hidden", touchAction: "none", cursor: "pointer" },
  speedChip: { position: "absolute", top: 10, right: 12, background: "rgba(22,35,63,.82)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, letterSpacing: 0.5 },
  overlay: { position: "absolute", inset: 0, display: "grid", placeItems: "center", backdropFilter: "blur(2px)" },
  card: { background: "#fff", borderRadius: 16, padding: "22px 22px 20px", width: "82%", maxWidth: 360, textAlign: "center", boxShadow: "0 16px 40px rgba(16,30,60,.28)", animation: "pop .22s ease-out" },
  bigIcon: { fontSize: 40, lineHeight: 1 },
  oTitle: { margin: "8px 0 6px", fontSize: 20, fontWeight: 800 },
  oText: { margin: "0 0 16px", fontSize: 13.5, color: "#5b6b86", lineHeight: 1.5 },
  reaction: { fontSize: 15, color: "#16233f", margin: "2px 0 4px" },
  points: { fontSize: 14, color: "#8a99b5", margin: "4px 0 16px", fontWeight: 600 },
  summary: { margin: "10px 0 16px", textAlign: "left" },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 2px", borderBottom: "1px solid #eef2f8" },
  btnPrimary: { background: "#c1272d", color: "#fff", border: "none", borderRadius: 11, padding: "13px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
  brakeBtn: { width: "100%", marginTop: 0, background: "#c1272d", color: "#fff", border: "none", borderRadius: "0 0 14px 14px", padding: "20px", fontSize: 22, fontWeight: 800, letterSpacing: 3, cursor: "pointer", transition: "transform .08s" },
};