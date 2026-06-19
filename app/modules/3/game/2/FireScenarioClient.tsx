// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const CORRECT_STEPS = [
  { id:"extinguish", num:1, label:"Use fire extinguisher",    detail:"Suppress the fire immediately using an appropriately rated extinguisher (CO2 for electrical fires).",     icon:"EXT",  color:"bg-red-500" },
  { id:"alarm",      num:2, label:"Trigger the fire alarm",   detail:"If the fire cannot be contained, immediately activate the physical fire alarm to alert all occupants.",    icon:"ALRM", color:"bg-orange-500" },
  { id:"evacuate",   num:3, label:"Evacuate to assembly point",detail:"Exit through designated emergency routes. Go directly to the designated assembly point outside the building.", icon:"EXIT", color:"bg-yellow-500" },
  { id:"call999",    num:4, label:"Call emergency services",   detail:"Call 999 immediately. Give your location, the nature of the fire, and confirm evacuation status.",          icon:"999",  color:"bg-blue-500" },
  { id:"rollcall",   num:5, label:"Execute team roll call",    detail:"At the assembly point, conduct a final roll call to confirm all team members are safely evacuated.",         icon:"ROLL", color:"bg-green-500" },
];

const ROUNDS = [
  { id:1, title:"Round 1 - Learn the Sequence", shuffled:["alarm","rollcall","extinguish","call999","evacuate"] },
  { id:2, title:"Round 2 - Speed Round",        shuffled:["evacuate","extinguish","rollcall","alarm","call999"] },
  { id:3, title:"Round 3 - Final Challenge",    shuffled:["call999","alarm","rollcall","evacuate","extinguish"] },
];

interface RoundResult { correct:boolean; timeUsed:number; points:number; userOrder:string[]; }
type Phase = "intro"|"playing"|"feedback"|"results";
const TIME_LIMIT = 50;

export default function FireScenarioClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]         = useState<Phase>("intro");
  const [rIdx, setRIdx]           = useState(0);
  const [order, setOrder]         = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [timeLeft, setTimeLeft]   = useState(TIME_LIMIT);
  const [results, setResults]     = useState<RoundResult[]>([]);
  const [saving, setSaving]       = useState(false);
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
    const pts      = correct ? 250 + Math.round(100*Math.max(0,1-timeUsed/TIME_LIMIT)) : 0;
    setResults(prev => [...prev, { correct, timeUsed, points:pts, userOrder:finalOrder }]);
    setPhase("feedback");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    setOrder([]); setAvailable([...round.shuffled]);
    setTimeLeft(TIME_LIMIT); startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t<=1) { stopTimer(); submitOrder([]); return 0; } return t-1; });
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
    if (rIdx+1 < ROUNDS.length) { setRIdx(r => r+1); setPhase("playing"); }
    else setPhase("results");
  }

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try { // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:3, game_id:2, points:totalPts, time_seconds:results.reduce((s,r)=>s+r.timeUsed,0), game_cards:passed?1:0 }); } catch(_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center">
          <div className="text-3xl font-black text-orange-600">FIRE</div>
        </div>
        <h2 className="text-[22px] font-bold text-gray-900">Server Room Fire Scenario</h2>
        <p className="text-[13px] text-gray-500">Module 3 · Game 2 of 2</p>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4">
        <p className="text-[12px] font-bold text-orange-800 mb-1">Scenario</p>
        <p className="text-[13px] text-orange-900 leading-relaxed">A fire breaks out in the server room from an electrical fault. You are the first to discover it. Sequence the 5 emergency response actions in the correct order.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format","5 shuffled actions","Place all 5 emergency response steps in the correct order"],
          ["Scoring","Speed + accuracy","Correct sequence with fast timing earns maximum points"],
          ["Rounds","3 rounds","Each round reshuffles the 5 actions"],
          ["Game Card","2 of 3 correct","Get 2 out of 3 rounds right to earn a Game Card"],
        ].map(([i,l,s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-black text-[11px] shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">This is an exam — no hints provided</p>
        <p className="text-[12px] text-red-600 mt-0.5">Apply your SHE Day training knowledge to sequence the correct emergency response.</p>
      </div>
      <button className="btn-primary" onClick={() => setPhase("playing")}>Start Exam</button>
    </div>
  );

  if (phase === "feedback") {
    const r = results[results.length-1];
    return (
      <div className="flex flex-col gap-4">
        <div className={`rounded-2xl p-5 text-center ${r.correct?"bg-green-50":"bg-red-50"}`}>
          <p className="text-[16px] font-bold mb-1">{r.correct ? `Correct! +${r.points} pts` : "Wrong sequence"}</p>
          <p className="text-[12px] text-gray-500">Round {rIdx+1} of {ROUNDS.length} · {r.timeUsed}s used</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Correct Sequence</p>
          </div>
          {CORRECT_STEPS.map((s,i) => {
            const userPos = r.userOrder.indexOf(s.id);
            const ok = userPos === i;
            return (
              <div key={s.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${ok?"":"bg-red-50"}`}>
                <div className={`w-9 h-9 rounded-xl ${s.color} text-white font-black text-[11px] flex items-center justify-center shrink-0`}>{s.num}</div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-gray-900">{s.label}</p>
                  <p className="text-[11px] text-gray-500">{s.detail}</p>
                  {!ok && r.userOrder.length > 0 && <p className="text-[11px] text-red-500 mt-0.5">You placed this at position {userPos===-1?"none":userPos+1}</p>}
                </div>
                <span className="font-bold text-[13px] shrink-0">{ok?"OK":"X"}</span>
              </div>
            );
          })}
        </div>
        <button className="btn-primary" onClick={nextRound}>
          {rIdx+1 < ROUNDS.length ? `Next Round (${rIdx+2}/${ROUNDS.length})` : "See Results"}
        </button>
      </div>
    );
  }

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Fire Safe!":"Keep Practising"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{totalCorrect}/{ROUNDS.length}</p>
        <p className="text-[13px] text-gray-500">rounds correct · {totalPts} pts</p>
        {passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",totalPts.toLocaleString(),"text-blue-700"],["Correct",`${totalCorrect}/${ROUNDS.length}`,passed?"text-green-700":"text-red-600"],["Card",passed?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-[12px] font-bold text-orange-800 mb-2">Remember: In a fire emergency</p>
        {CORRECT_STEPS.map((s,i)=>(
          <p key={s.id} className="text-[12px] text-orange-900 mb-1"><span className="font-bold">{i+1}.</span> {s.label}</p>
        ))}
        <p className="text-[11px] text-orange-700 mt-2 font-semibold">For electrical fires always use CO2 extinguisher — never water!</p>
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/3")}>Back to Module 3</button>
    </div>
  );

  const timerPct = (timeLeft/TIME_LIMIT)*100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-700">{round.title}</p>
          <p className="text-[11px] text-gray-400">Place step {order.length+1} of {CORRECT_STEPS.length}</p>
        </div>
        <div className={`text-[24px] font-black ${timeLeft<=10?"text-red-500":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>50?"bg-green-500":timerPct>25?"bg-yellow-400":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
        <p className="text-[12px] text-orange-800 font-medium">Server room electrical fire — sequence the response steps correctly</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Your Sequence</p>
        <div className="flex flex-col gap-2">
          {CORRECT_STEPS.map((_,i) => {
            const placedId = order[i];
            const step = placedId ? CORRECT_STEPS.find(s=>s.id===placedId) : null;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${step?`border-transparent ${step.color.replace("bg-","bg-").replace("500","100")} `:"border-dashed border-gray-200 bg-gray-50"}`}>
                <div className={`w-7 h-7 rounded-full ${step?step.color:"bg-gray-300"} text-white text-[12px] font-bold flex items-center justify-center shrink-0`}>{i+1}</div>
                {step
                  ? <p className="text-[13px] font-semibold text-gray-800">{step.label}</p>
                  : <p className="text-[12px] text-gray-400 italic">Tap a step below...</p>
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
              const s = CORRECT_STEPS.find(st=>st.id===id)!;
              return (
                <button key={id} onClick={()=>handleSelect(id)}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:scale-95 transition-all text-left w-full">
                  <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center text-white text-[11px] font-black shrink-0`}>{s.icon}</div>
                  <div className="flex-1">
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
