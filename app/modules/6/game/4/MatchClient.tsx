// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

type Zone = "heartattack" | "cardiacarrest" | "unassigned";

interface Item { id: string; text: string; correctZone: "heartattack" | "cardiacarrest" | "neither"; }

const ITEMS: Item[] = [
  { id:"i1", text:"Blood flow is blocked by a clot in the artery", correctZone:"heartattack" },
  { id:"i2", text:"A circulation problem within the blood vessels", correctZone:"heartattack" },
  { id:"i3", text:"The person is usually still conscious", correctZone:"heartattack" },
  { id:"i4", text:"Symptoms tend to develop gradually", correctZone:"heartattack" },
  { id:"i5", text:"Requires fast medical care to restore blood flow", correctZone:"heartattack" },
  { id:"i6", text:"The heart suddenly stops beating entirely", correctZone:"cardiacarrest" },
  { id:"i7", text:"An electrical malfunction within the heart", correctZone:"cardiacarrest" },
  { id:"i8", text:"The person is unconscious with no response", correctZone:"cardiacarrest" },
  { id:"i9", text:"The event happens suddenly without warning", correctZone:"cardiacarrest" },
  { id:"i10", text:"Requires immediate CPR and defibrillation", correctZone:"cardiacarrest" },
  { id:"i11", text:"Can be fully prevented through diet alone", correctZone:"neither" },
  { id:"i12", text:"Only ever affects people above the age of 60", correctZone:"neither" },
];

function shuffle<T>(arr:T[]):T[] { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

const TIME_LIMIT = 180;
const PTS_CORRECT = 10;
const PTS_WRONG = -5;
const GAME_CARD_PCT = 75;

type Phase = "intro" | "playing" | "results";

export default function MatchClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [pool, setPool] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Record<string, Zone>>({});
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function start() {
    const order = shuffle(ITEMS.map(i=>i.id));
    setPool(order);
    const initial: Record<string,Zone> = {};
    order.forEach(id => initial[id] = "unassigned");
    setAssignment(initial);
    setTimeLeft(TIME_LIMIT);
    setPhase("playing");
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t<=1) { stopTimer(); submit(); return 0; } return t-1; });
    }, 1000);
  }

  function placeInZone(zone: Zone) {
    if (!selected) return;
    setAssignment(prev => ({ ...prev, [selected]: zone }));
    setSelected(null);
  }

  function submit() {
    stopTimer();
    setPhase("results");
  }

  useEffect(() => () => stopTimer(), []);

  const correctCount = ITEMS.filter(it => {
    const placed = assignment[it.id];
    if (it.correctZone === "neither") return placed === "unassigned";
    return placed === it.correctZone;
  }).length;
  const wrongCount = ITEMS.length - correctCount;
  const pct = Math.round((correctCount/ITEMS.length)*100);
  const totalPts = Math.max(0, correctCount*PTS_CORRECT - wrongCount*Math.abs(PTS_WRONG));
  const passed = pct >= GAME_CARD_PCT;
  const allPlaced = Object.values(assignment).every(z => z !== "unassigned") || ITEMS.filter(i=>i.correctZone!=="neither").every(i => assignment[i.id] !== "unassigned");

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try { // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:6, game_id:4, points:totalPts, time_seconds:TIME_LIMIT-timeLeft, game_cards:passed?1:0 }); } catch(_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-xl font-black text-blue-600">VS</div>
        <h2 className="text-[22px] font-bold text-gray-900">Heart Attack vs Cardiac Arrest</h2>
        <p className="text-[13px] text-gray-500">Module 6 . Game 4 of 4</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1","12 characteristic cards","Tap a card, then tap the box it belongs to"],
          ["2","Two condition boxes","Heart Attack and Cardiac Arrest are different medical events"],
          ["3","Watch for traps","Some cards belong to neither box - leave those unassigned"],
          ["4","3-minute timer","+10 per correct placement, -5 per wrong one"],
        ].map(([i,l,s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - one submission only</p>
        <p className="text-[12px] text-red-600 mt-0.5">No hints. Results revealed only after you submit.</p>
      </div>
      <button className="btn-primary" onClick={start}>Start Sorting</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Correctly Sorted!":"Keep Studying"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/{ITEMS.length}</p>
        <p className="text-[13px] text-gray-500">{pct}% correct . {totalPts} pts</p>
        {passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Answer Review</p></div>
        <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {ITEMS.map(it => {
            const placed = assignment[it.id];
            const ok = it.correctZone==="neither" ? placed==="unassigned" : placed===it.correctZone;
            const zoneLabel: Record<string,string> = { heartattack:"Heart Attack", cardiacarrest:"Cardiac Arrest", unassigned:"Left unassigned" };
            return (
              <li key={it.id} className="px-4 py-3 flex items-start gap-3">
                <span className={`mt-0.5 text-[13px] font-bold shrink-0 ${ok?"text-green-600":"text-red-500"}`}>{ok?"+":"-"}</span>
                <div className="flex-1">
                  <p className="text-[12px] text-gray-800">{it.text}</p>
                  <p className={`text-[11px] mt-0.5 ${ok?"text-green-600":"text-red-500"}`}>You placed: {zoneLabel[placed]}</p>
                  {!ok && <p className="text-[11px] text-gray-500">Correct: {it.correctZone==="neither"?"Belongs to neither box":zoneLabel[it.correctZone]}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/6")}>Back to Module 6</button>
    </div>
  );

  const remaining = pool.filter(id => assignment[id] === "unassigned");
  const haItems = pool.filter(id => assignment[id] === "heartattack");
  const caItems = pool.filter(id => assignment[id] === "cardiacarrest");
  const timerPct = (timeLeft/TIME_LIMIT)*100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">{remaining.length} cards remaining</p>
        <div className={`text-[16px] font-black ${timeLeft<=30?"text-red-500":"text-blue-700"}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>30?"bg-blue-500":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>

      {selected && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-1">Selected card - tap a box below</p>
          <p className="text-[13px] text-blue-900">{ITEMS.find(i=>i.id===selected)?.text}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={()=>placeInZone("heartattack")} disabled={!selected}
          className="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-left disabled:opacity-50 transition-all active:scale-95">
          <p className="text-[11px] font-bold text-red-700 uppercase mb-1.5">Heart Attack</p>
          <div className="flex flex-col gap-1">
            {haItems.map(id => <span key={id} className="text-[10px] bg-white border border-red-200 rounded px-1.5 py-1 text-red-800">{ITEMS.find(i=>i.id===id)?.text.slice(0,30)}...</span>)}
            {haItems.length===0 && <span className="text-[10px] text-red-300 italic">Empty</span>}
          </div>
        </button>
        <button onClick={()=>placeInZone("cardiacarrest")} disabled={!selected}
          className="rounded-xl border-2 border-purple-200 bg-purple-50 p-3 text-left disabled:opacity-50 transition-all active:scale-95">
          <p className="text-[11px] font-bold text-purple-700 uppercase mb-1.5">Cardiac Arrest</p>
          <div className="flex flex-col gap-1">
            {caItems.map(id => <span key={id} className="text-[10px] bg-white border border-purple-200 rounded px-1.5 py-1 text-purple-800">{ITEMS.find(i=>i.id===id)?.text.slice(0,30)}...</span>)}
            {caItems.length===0 && <span className="text-[10px] text-purple-300 italic">Empty</span>}
          </div>
        </button>
      </div>

      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Unsorted cards - tap one to select</p>
      <div className="flex flex-col gap-2">
        {remaining.map(id => {
          const it = ITEMS.find(i=>i.id===id)!;
          const isSel = selected===id;
          return (
            <button key={id} onClick={()=>setSelected(isSel?null:id)}
              className={`text-left px-4 py-3 rounded-xl border-2 text-[12.5px] font-medium transition-all ${isSel?"border-blue-500 bg-blue-50":"border-gray-200 bg-white hover:border-blue-300"}`}>
              {it.text}
            </button>
          );
        })}
      </div>

      {remaining.length === 0 && (
        <button className="btn-primary" onClick={submit}>Submit Final Sorting</button>
      )}
    </div>
  );
}
