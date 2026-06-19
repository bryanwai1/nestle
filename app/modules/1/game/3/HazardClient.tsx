// @ts-nocheck
"use client";
import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCENES, POINTS_PER_HAZARD, SPEED_BONUS, GAME_CARD_THRESHOLD, type Hazard } from "./hazard-data";
import { useTeam } from "@/lib/useTeam";

type Phase = "intro"|"playing"|"review"|"results";
interface Tap { x: number; y: number; hit: Hazard|null; ts: number; }
interface SceneResult { sceneId: number; found: string[]; missed: string[]; taps: Tap[]; points: number; timeUsed: number; }

const SCENE_SVGS = [
  (foundIds: string[], revealAll: boolean) => {
    const show = (id:string) => foundIds.includes(id)||revealAll;
    return (
      <svg viewBox="0 0 160 90" className="w-full rounded-xl" style={{aspectRatio:"16/9"}}>
        <image href="https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80" width="160" height="90" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.9 }} />
        {show("tailgate") && <circle cx="70" cy="59" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("phone") && <circle cx="29" cy="62" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("debris") && <circle cx="100" cy="64" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("blindspot") && <circle cx="130" cy="59" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
      </svg>
    )
  },
  (foundIds: string[], revealAll: boolean) => {
    const show = (id:string) => foundIds.includes(id)||revealAll;
    return (
      <svg viewBox="0 0 160 90" className="w-full rounded-xl" style={{aspectRatio:"16/9"}}>
        <image href="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80" width="160" height="90" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.9 }} />
        {show("redlight") && <circle cx="125" cy="47" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("pedestrian") && <circle cx="80" cy="65" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("cyclist") && <circle cx="30" cy="52" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("wetroad") && <ellipse cx="80" cy="77" rx="10" ry="5" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("parked") && <circle cx="10" cy="46" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
      </svg>
    )
  },
  (foundIds: string[], revealAll: boolean) => {
    const show = (id:string) => foundIds.includes(id)||revealAll;
    return (
      <svg viewBox="0 0 160 90" className="w-full rounded-xl" style={{aspectRatio:"16/9"}}>
        <image href="https://images.unsplash.com/photo-1515569067071-ec3b51335dd0?auto=format&fit=crop&w=1200&q=80" width="160" height="90" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.9 }} />
        {show("nolight") && <circle cx="52" cy="60" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("aquaplane") && <ellipse cx="88" cy="79" rx="12" ry="5" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("fatigue") && <circle cx="137" cy="23" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
        {show("foglight") && <circle cx="74" cy="85" r="6" fill="rgba(255,0,0,0.3)" stroke="#FF1744" strokeWidth="1.5" className="animate-pulse" />}
      </svg>
    )
  }
];

export default function HazardClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sIdx, setSIdx] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [taps, setTaps] = useState<Tap[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<SceneResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [ripples, setRipples] = useState<{x:number;y:number;id:number;hit:boolean}[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const startRef = useRef(0);
  const rippleId = useRef(0);

  const scene = SCENES[sIdx];
  const totalHazards = SCENES.reduce((s, sc) => s + sc.hazards.length, 0);
  const allFound = results.flatMap(r => r.found);
  const allMissed = results.flatMap(r => r.missed);
  const totalPoints = results.reduce((s, r) => s + r.points, 0);
  const totalFound = allFound.length;
  const passed = totalFound >= GAME_CARD_THRESHOLD;

  const stopTimer = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    setFoundIds([]); setTaps([]); setTimeLeft(scene.timeLimit); startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); endScene(); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, sIdx]); // eslint-disable-line

  function endScene() {
    stopTimer();
    setFoundIds(fids => {
      setTaps(tp => {
        const timeUsed = Math.round((Date.now() - startRef.current) / 1000);
        const missed = scene.hazards.filter(h => !fids.includes(h.id)).map(h => h.id);
        const pts = fids.reduce((s, id) => {
          const tap = tp.find(t => t.hit?.id === id);
          const speed = tap ? Math.max(0, 1 - tap.ts / scene.timeLimit) : 0;
          return s + POINTS_PER_HAZARD + Math.round(SPEED_BONUS * speed);
        }, 0);
        setResults(prev => [...prev, { sceneId: scene.id, found: fids, missed, taps: tp, points: pts, timeUsed }]);
        return tp;
      });
      return fids;
    });
    setTimeout(() => setPhase("review"), 300);
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (phase !== "playing" || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 160;
    const py = ((e.clientY - rect.top) / rect.height) * 90;
    const hit = scene.hazards.find(h => !foundIds.includes(h.id) && Math.hypot(px - h.x, py - h.y) < h.r + 4) || null;
    const rId = ++rippleId.current;
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;
    setRipples(r => [...r, { x: pctX, y: pctY, id: rId, hit: !!hit }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== rId)), 700);
    if (hit) {
      const ts = Math.round((Date.now() - startRef.current) / 1000);
      setFoundIds(prev => [...prev, hit.id]);
      setTaps(prev => [...prev, { x: pctX, y: pctY, hit, ts }]);
    } else {
      setTaps(prev => [...prev, { x: pctX, y: pctY, hit: null, ts: Math.round((Date.now()-startRef.current)/1000) }]);
    }
  }

  useEffect(() => {
    if (foundIds.length === scene.hazards.length && phase === "playing") endScene();
  }, [foundIds]); // eslint-disable-line

  function nextScene() {
    if (sIdx + 1 < SCENES.length) { setSIdx(s => s + 1); setPhase("playing"); }
    else setPhase("results");
  }

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try { // @ts-ignore
      await sb.from("scores").upsert({ team_id: teamId, module_id: 1, game_id: 3, points: totalPoints, time_seconds: results.reduce((s,r)=>s+r.timeUsed,0), game_cards: passed?1:0 }); } catch(_){}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  // ── INTRO ──
  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-5xl">🎯</div>
        <h2 className="text-[22px] font-bold text-gray-900">Hazard Spotter</h2>
        <p className="text-[13px] text-gray-500">Module 1 · Game 3 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["🚗","3 driving scenes","Highway, Urban junction and Rainy night"],["👆","Tap to flag hazards","Tap directly on hazards in the scene"],["⚡","Speed bonus","Find hazards fast for extra points"],["🃏","Game Card",`Find ${GAME_CARD_THRESHOLD}/${totalHazards} hazards to earn one`]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <span className="text-xl mt-0.5">{i}</span>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => setPhase("playing")}>Start Spotting ▶</button>
    </div>
  );

  // ── REVIEW ──
  if (phase === "review") {
    const sr = results[results.length - 1];
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scene {sIdx + 1} Results</p>
            <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{scene.title}</p>
            <p className="text-[12px] text-gray-400">{sr.found.length}/{scene.hazards.length} hazards found · {sr.points} pts</p>
          </div>
          {/* Revealed scene */}
          <div className="relative p-3 bg-gray-900">
            {React.createElement("svg", { viewBox:"0 0 160 90", className:"w-full rounded-xl", style:{aspectRatio:"16/9"} },
              ...[]
            )}
            <div className="rounded-xl overflow-hidden">
              {sIdx === 0 && SCENE_SVGS[0](scene.hazards.map(h=>h.id), true)}
              {sIdx === 1 && SCENE_SVGS[1](scene.hazards.map(h=>h.id), true)}
              {sIdx === 2 && SCENE_SVGS[2](scene.hazards.map(h=>h.id), true)}
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {scene.hazards.map(h => {
              const found = sr.found.includes(h.id);
              return (
                <li key={h.id} className="px-4 py-3 flex items-start gap-3">
                  <span className={`text-[18px] shrink-0 ${found ? "" : "grayscale opacity-40"}`}>{found ? "✅" : "❌"}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">{h.label}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{h.explanation}</p>
                  </div>
                  {found && <span className="text-[11px] font-bold text-blue-700 shrink-0">+{POINTS_PER_HAZARD}+</span>}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
          <span className="text-[13px] font-medium text-blue-700">Total so far</span>
          <span className="text-[14px] font-bold text-blue-700">{results.reduce((s,r)=>s+r.found.length,0)} found · {results.reduce((s,r)=>s+r.points,0)} pts</span>
        </div>
        <button className="btn-primary" onClick={nextScene}>
          {sIdx + 1 < SCENES.length ? `Next Scene (${sIdx + 2}/${SCENES.length}) →` : "See Final Results →"}
        </button>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <div className="text-5xl mb-3">{passed?"🏆":"🔍"}</div>
        <p className={`text-[13px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Certified Spotter!":"Keep Practising"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{totalFound}/{totalHazards}</p>
        <p className="text-[13px] text-gray-500">hazards found · {totalPoints.toLocaleString()} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">🃏 Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",totalPoints.toLocaleString(),"text-blue-700"],["Found",`${totalFound}/${totalHazards}`,passed?"text-green-700":"text-red-600"],["Card",passed?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2">Key Reminders</p>
        <ul className="space-y-1.5">
          {["Always maintain a 3-second following distance","Never drive distracted — no phones while driving","Check for cyclists and pedestrians at every junction","Rest every 2 hours on long journeys — fatigue kills"].map(tip=>(
            <li key={tip} className="flex items-start gap-2 text-[12px] text-gray-600">
              <span className="text-green-600 shrink-0 mt-0.5">✓</span>{tip}
            </li>
          ))}
        </ul>
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving…</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/1")}>← Back to Module 1</button>
      
    </div>
  );

  // ── PLAYING ──
  const timerPct = (timeLeft / scene.timeLimit) * 100;
  const timerColor = timerPct > 50 ? "bg-green-500" : timerPct > 25 ? "bg-yellow-400" : "bg-red-500";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-gray-400">Scene {sIdx+1}/{SCENES.length} · {scene.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{foundIds.length}/{scene.hazards.length} hazards found</p>
        </div>
        <div className={`text-[20px] font-black ${timeLeft<=5?"text-red-500 animate-pulse":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{width:`${timerPct}%`}}/>
      </div>
      <p className="text-[12px] text-gray-500 text-center">{scene.description}</p>

      {/* SVG Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 cursor-crosshair bg-gray-900">
        <div className="relative select-none">
          {sIdx===0&&(<svg ref={svgRef} viewBox="0 0 160 90" className="w-full" style={{aspectRatio:"16/9",display:"block"}} onClick={handleSvgClick}>{SCENE_SVGS[0](foundIds,false)}</svg>)}
          {sIdx===1&&(<svg ref={svgRef} viewBox="0 0 160 90" className="w-full" style={{aspectRatio:"16/9",display:"block"}} onClick={handleSvgClick}>{SCENE_SVGS[1](foundIds,false)}</svg>)}
          {sIdx===2&&(<svg ref={svgRef} viewBox="0 0 160 90" className="w-full" style={{aspectRatio:"16/9",display:"block"}} onClick={handleSvgClick}>{SCENE_SVGS[2](foundIds,false)}</svg>)}
          {/* Ripples */}
          {ripples.map(rp=>(
            <div key={rp.id} className="pointer-events-none absolute" style={{left:`${rp.x}%`,top:`${rp.y}%`,transform:"translate(-50%,-50%)"}}>
              <div className={`w-10 h-10 rounded-full border-2 animate-ping ${rp.hit?"border-green-400":"border-red-400"}`} style={{animationDuration:"0.6s",animationIterationCount:1}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Found badges */}
      <div className="flex flex-wrap gap-2">
        {scene.hazards.map(h=>(
          <span key={h.id} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${foundIds.includes(h.id)?"bg-green-50 border-green-300 text-green-700":"bg-gray-100 border-gray-200 text-gray-400"}`}>
            {foundIds.includes(h.id)?"✓ ":""}{h.label}
          </span>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400">Tap on hazards in the scene above</p>
    </div>
  );
}
