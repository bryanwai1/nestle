// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

interface Item { id:string; label:string; description:string; pass:boolean; }
interface Scenario { id:number; title:string; items:Item[]; }

const SCENARIOS: Scenario[] = [
  { id:1, title:"Casualty Position A", items:[
    { id:"head", label:"Head Tilt", description:"The head is tilted back with the chin up to keep the airway open.", pass:true },
    { id:"arm",  label:"Upper Arm Position", description:"The upper arm is bent and used to support the head, with the hand under the cheek.", pass:true },
    { id:"leg",  label:"Leg Position", description:"Both legs are kept straight and together, lying flat on the ground.", pass:false },
    { id:"body", label:"Body Angle", description:"The casualty is rolled fully onto their side at a stable angle.", pass:true } ]},
  { id:2, title:"Casualty Position B", items:[
    { id:"head", label:"Head Tilt", description:"The head is left flat with the chin tucked down toward the chest.", pass:false },
    { id:"arm",  label:"Upper Arm Position", description:"Both arms are left at the casualty's sides, not used for support.", pass:false },
    { id:"leg",  label:"Leg Position", description:"The upper leg is bent at a right angle at both the hip and knee.", pass:true },
    { id:"body", label:"Body Angle", description:"The casualty remains lying flat on their back throughout.", pass:false } ]},
  { id:3, title:"Casualty Position C", items:[
    { id:"head", label:"Head Tilt", description:"The head is tilted back slightly with the mouth pointing toward the ground.", pass:true },
    { id:"arm",  label:"Upper Arm Position", description:"The lower arm is positioned at a right angle, palm facing up, supporting the body.", pass:true },
    { id:"leg",  label:"Leg Position", description:"Both legs are crossed tightly together at the ankles.", pass:false },
    { id:"body", label:"Body Angle", description:"The casualty is positioned face down, fully prone on the ground.", pass:false } ]},
];

const TIME_PER_ITEM = 15;
const PTS_CORRECT = 10;
const PTS_WRONG = -5;
const GAME_CARD_THRESHOLD = 9;

type Phase = "intro" | "playing" | "results";
interface Answer { scenarioIdx:number; itemId:string; userPass:boolean|null; correct:boolean; }

export default function RecoveryClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sIdx, setSIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ITEM);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  const scenario = SCENARIOS[sIdx];
  const item = scenario.items[itemIdx];
  const totalItems = SCENARIOS.reduce((s,sc)=>s+sc.items.length,0);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function start() {
    setSIdx(0); setItemIdx(0); setAnswers([]);
    setPhase("playing");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(TIME_PER_ITEM);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t<=1) { stopTimer(); handleAnswer(null); return 0; } return t-1; });
    }, 1000);
    return stopTimer;
  }, [phase, sIdx, itemIdx]); // eslint-disable-line

  function handleAnswer(userPass: boolean | null) {
    stopTimer();
    const correct = userPass !== null && userPass === item.pass;
    const newAns: Answer = { scenarioIdx: sIdx, itemId: item.id, userPass, correct };
    const allSoFar = [...answers, newAns];
    setAnswers(allSoFar);

    if (itemIdx + 1 < scenario.items.length) {
      setItemIdx(i => i + 1);
    } else if (sIdx + 1 < SCENARIOS.length) {
      setSIdx(s => s + 1);
      setItemIdx(0);
    } else {
      setPhase("results");
    }
  }

  const correctCount = answers.filter(a => a.correct).length;
  const wrongCount = answers.length - correctCount;
  const totalPts = Math.max(0, correctCount*PTS_CORRECT - wrongCount*Math.abs(PTS_WRONG));
  const passed = correctCount >= GAME_CARD_THRESHOLD;

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try { // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:10, game_id:4, points:totalPts, time_seconds:0, game_cards:passed?1:0 }); } catch(_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-2xl font-black text-red-600">RP</div>
        <h2 className="text-[22px] font-bold text-gray-900">Recovery Position Blueprint</h2>
        <p className="text-[13px] text-gray-500">Module 10 . Game 4 of 4</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1","3 casualty scenarios","Each with 4 positioning elements to assess"],
          ["2","Pass or Fail","Judge correct vs incorrect recovery position elements"],
          ["3",`${TIME_PER_ITEM}s per item`,"+10 correct / -5 wrong"],
          ["4","No feedback until the very end","All 12 results are revealed together after the last item"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - no hints provided</p>
        <p className="text-[12px] text-red-600 mt-0.5">Apply your knowledge of the correct recovery position.</p>
      </div>
      <button className="btn-primary" onClick={start}>Start Inspection</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Recovery Position Certified!":"Keep Studying"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/{totalItems}</p>
        <p className="text-[13px] text-gray-500">{totalPts} pts ({correctCount} right, {wrongCount} wrong)</p>
        {passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Full Answer Review</p></div>
        {SCENARIOS.map((sc, si) => (
          <div key={sc.id}>
            <div className="px-4 py-2 bg-gray-50/60"><p className="text-[11px] font-bold text-gray-500">{sc.title}</p></div>
            {sc.items.map((it, ii) => {
              const ans = answers.find(a => a.scenarioIdx === si && a.itemId === it.id)!;
              return (
                <div key={it.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 ${ans.correct?"":"bg-red-50"}`}>
                  <span className={`mt-0.5 text-[13px] font-bold shrink-0 ${ans.correct?"text-green-600":"text-red-500"}`}>{ans.correct?"+":"-"}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-gray-900">{it.label} - {it.pass?"PASS":"FAIL"}</p>
                    <p className="text-[11px] text-gray-500">{it.description}</p>
                    {!ans.correct && <p className="text-[11px] text-red-500 mt-0.5">You answered: {ans.userPass===null?"Not answered":ans.userPass?"Pass":"Fail"}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/10")}>Back to Module 10</button>
    </div>
  );

  const timerPct = (timeLeft / TIME_PER_ITEM) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-[12px] text-gray-400">
        <span>Scenario {sIdx+1}/{SCENARIOS.length} . Item {itemIdx+1}/{scenario.items.length}</span>
        <span className={`font-bold ${timeLeft<=5?"text-red-500":"text-blue-700"}`}>{timeLeft}s</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>30?"bg-blue-500":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2">
        <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide">{scenario.title}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Check Item {itemIdx+1} of {scenario.items.length}</p>
        <p className="text-[16px] font-bold text-gray-900 mb-3">{item.label}</p>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[14px] text-gray-700 leading-relaxed italic">{item.description}</p>
        </div>
      </div>
      <p className="text-center text-[12px] text-gray-400 font-medium">Does this element PASS or FAIL the recovery position?</p>
      <div className="grid grid-cols-2 gap-3">
        <button className="py-5 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-[16px] hover:bg-green-100 active:scale-95 transition-all" onClick={()=>handleAnswer(true)}>PASS</button>
        <button className="py-5 rounded-2xl border-2 border-red-300 bg-red-50 text-red-600 font-bold text-[16px] hover:bg-red-100 active:scale-95 transition-all" onClick={()=>handleAnswer(false)}>FAIL</button>
      </div>
    </div>
  );
}
