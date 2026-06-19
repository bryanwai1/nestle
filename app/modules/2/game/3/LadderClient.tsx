// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const CORRECT_STEPS = [
  { id:"inspect", icon:"Inspect", label:"Inspect the ladder",  detail:"Check the ladder structural condition. Confirm it is not bent, cracked or damaged before use." },
  { id:"floor",   icon:"Floor",   label:"Check the floor area", detail:"Confirm the floor area is stable, non-slippery and completely free of physical hazards." },
  { id:"aisle",   icon:"Aisle",   label:"Clear the aisle",      detail:"Ensure all warehouse aisles around the work area are kept clear of obstructions." },
  { id:"buddy",   icon:"Buddy",   label:"Assign a buddy",       detail:"Always assign a second teammate to steady the ladder base during use." },
];

const ROUNDS = [
  { id:1, title:"Round 1 - Basic Order",     shuffled:["floor","buddy","inspect","aisle"] },
  { id:2, title:"Round 2 - Speed Round",     shuffled:["buddy","aisle","floor","inspect"] },
  { id:3, title:"Round 3 - Final Challenge", shuffled:["aisle","inspect","buddy","floor"] },
];

interface RoundResult { correct:boolean; timeUsed:number; points:number; userOrder:string[]; }
type Phase = "intro"|"playing"|"feedback"|"results";
const TIME_LIMIT = 45;

export default function LadderClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]           = useState<Phase>("intro");
  const [rIdx, setRIdx]             = useState(0);
  const [order, setOrder]           = useState<string[]>([]);
  const [available, setAvailable]   = useState<string[]>([]);
  const [timeLeft, setTimeLeft]     = useState(TIME_LIMIT);
  const [results, setResults]       = useState<RoundResult[]>([]);
  const [saving, setSaving]         = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const startRef = useRef<number>(0);

  const round        = ROUNDS[rIdx];
  const totalPts     = results.reduce((s,r) => s+r.points, 0);
  const totalCorrect = results.filter(r => r.correct).length;
  const passed       = totalCorrect >= 2;

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function submitOrder(finalOrder: string[]) {
    stopTimer();
    const timeUsed = Math.min(TIME_LIMIT, Math.round((Date.now()-startRef.current)/1000));
    const correct  = CORRECT_STEPS.every((s,i) => s.id === finalOrder[i]);
    const pts      = correct ? 200 + Math.round(100*Math.max(0, 1-timeUsed/TIME_LIMIT)) : 0;
    setResults(prev => [...prev, { correct, timeUsed, points:pts, userOrder:finalOrder }]);
    setPhase("feedback");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    setOrder([]);
    setAvailable([...round.shuffled]);
    setTimeLeft(TIME_LIMIT);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); submitOrder([]); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, rIdx]); // eslint-disable-line

  function handleSelect(id: string) {
    const next = [...order, id];
    setOrder(next);
    setAvailable(a => a.filter(x => x !== id));
    if (next.length === CORRECT_STEPS.length) submitOrder(next);
  }

  function nextRound() {
    if (rIdx + 1 < ROUNDS.length) { setRIdx(r => r+1); setPhase("playing"); }
    else setPhase("results");
  }

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try { // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:2, game_id:3, points:totalPts, time_seconds:results.reduce((s,r)=>s+r.timeUsed,0), game_cards:passed?1:0 }); } catch(_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  const STEP_COLORS = ["bg-blue-50 border-blue-200","bg-purple-50 border-purple-200","bg-orange-50 border-orange-200","bg-green-50 border-green-200"];

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-4xl font-bold text-red-600">S-T-F</div>
        <h2 className="text-[22px] font-bold text-gray-900">Ladder Safety Sequencer</h2>
        <p className="text-[13px] text-gray-500">Module 2 · Game 3 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1.","4 safety steps","Arrange portable ladder safety procedures in the correct order"],
          ["2.","Tap to place","Tap each step in the correct sequence from first to last"],
          ["3.","3 rounds","Get faster each round for maximum points"],
          ["4.","Game Card","Get 2 out of 3 rounds correct to earn one"],
        ].map(([i,l,s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <span className="text-base font-bold text-blue-600 mt-0.5 w-6 shrink-0">{i}</span>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => setPhase("playing")}>Start Sequencing</button>
    </div>
  );

  if (phase === "feedback") {
    const r = results[results.length-1];
    return (
      <div className="flex flex-col gap-4">
        <div className={`rounded-2xl p-5 text-center ${r.correct?"bg-green-50":"bg-red-50"}`}>
          <div className="text-5xl mb-2">{r.correct?"✓":"✗"}</div>
          <p className={`text-[16px] font-bold mb-1 ${r.correct?"text-green-700":"text-red-600"}`}>
            {r.correct ? `Correct! +${r.points} pts` : "Wrong order"}
          </p>
          <p className="text-[12px] text-gray-500">Round {rIdx+1} of {ROUNDS.length} · {r.timeUsed}s</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Correct Order</p>
          </div>
          {CORRECT_STEPS.map((s,i) => {
            const userPos = r.userOrder.indexOf(s.id);
            const ok = userPos === i;
            return (
              <div key={s.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${ok?"":"bg-red-50"}`}>
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">{s.label}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{s.detail}</p>
                  {!ok && r.userOrder.length > 0 && (
                    <p className="text-[11px] text-red-500 mt-0.5">You placed this at position {userPos === -1 ? "none (timed out)" : userPos+1}</p>
                  )}
                </div>
                <span className="text-[18px] shrink-0">{ok?"OK":"X"}</span>
              </div>
            );
          })}
        </div>
        <button className="btn-primary" onClick={nextRound}>
          {rIdx+1 < ROUNDS.length ? `Next Round (${rIdx+2}/${ROUNDS.length})` : "See Final Results"}
        </button>
      </div>
    );
  }

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <div className="text-5xl mb-3">{passed?"Trophy":"Try Again"}</div>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>
          {passed ? "Ladder Safe!" : "Keep Practising"}
        </p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{totalCorrect}/{ROUNDS.length}</p>
        <p className="text-[13px] text-gray-500">rounds correct · {totalPts} pts</p>
        {passed && (
          <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">
            Game Card Earned!
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",totalPts.toLocaleString(),"text-blue-700"],["Correct",`${totalCorrect}/${ROUNDS.length}`,passed?"text-green-700":"text-red-600"],["Card",passed?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">The 4 Steps</p>
        {CORRECT_STEPS.map((s,i) => (
          <div key={s.id} className="flex items-start gap-3 mb-3 last:mb-0">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i+1}</div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900">{s.label}</p>
              <p className="text-[11px] text-gray-500">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/2")}>Back to Module 2</button>
    </div>
  );

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-700">{round.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {order.length < CORRECT_STEPS.length ? `Place step ${order.length+1} of ${CORRECT_STEPS.length}` : "All steps placed!"}
          </p>
        </div>
        <div className={`text-[24px] font-black ${timeLeft<=10?"text-red-500":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timerPct>50?"bg-green-500":timerPct>25?"bg-yellow-400":"bg-red-500"}`}
          style={{ width:`${timerPct}%` }}
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Your Sequence</p>
        <div className="flex flex-col gap-2">
          {CORRECT_STEPS.map((_,i) => {
            const placedId = order[i];
            const step = placedId ? CORRECT_STEPS.find(s => s.id === placedId) : null;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${step?"border-blue-300 bg-blue-50":"border-dashed border-gray-200 bg-gray-50"}`}>
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i+1}</div>
                {step
                  ? <p className="text-[13px] font-semibold text-blue-800">{step.label}</p>
                  : <p className="text-[12px] text-gray-400 italic">Tap a step below to place here</p>
                }
              </div>
            );
          })}
        </div>
      </div>
      {available.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Tap to place next</p>
          <div className="flex flex-col gap-2">
            {available.map(id => {
              const s = CORRECT_STEPS.find(st => st.id === id)!;
              return (
                <button key={id} onClick={() => handleSelect(id)}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:scale-95 transition-all text-left w-full">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-blue-700 text-center leading-tight">{s.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900">{s.label}</p>
                    <p className="text-[11px] text-gray-500">{s.detail.slice(0,70)}...</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
