// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const ITEMS = [
  { id:1,  label:"Code 1 (PET) - Mineral Water Bottle",      recyclable:true  },
  { id:2,  label:"Code 1 (PET) - Soft Drink Bottle",         recyclable:true  },
  { id:3,  label:"Code 2 (HDPE) - Milk Jug",                 recyclable:true  },
  { id:4,  label:"Code 2 (HDPE) - Shampoo Bottle",           recyclable:true  },
  { id:5,  label:"Code 3 (PVC) - Plumbing Pipe",             recyclable:false },
  { id:6,  label:"Code 3 (PVC) - Cling Wrap Film",           recyclable:false },
  { id:7,  label:"Code 4 (LDPE) - Plastic Shopping Bag",     recyclable:true  },
  { id:8,  label:"Code 4 (LDPE) - Squeeze Bottle",           recyclable:true  },
  { id:9,  label:"Code 5 (PP) - Yogurt Container",           recyclable:true  },
  { id:10, label:"Code 5 (PP) - Bottle Cap",                 recyclable:true  },
  { id:11, label:"Code 6 (PS) - Styrofoam Cup",              recyclable:false },
  { id:12, label:"Code 6 (PS) - Disposable Cutlery",         recyclable:false },
  { id:13, label:"Code 7 (Other) - Baby Bottle",             recyclable:false },
  { id:14, label:"Code 7 (Other) - CD / DVD Disc",           recyclable:false },
];

type Phase = "intro"|"playing"|"results";
interface Answer { id:number; correct:boolean; userAnswer:boolean|null; }

const TIME_PER_ITEM = 10;
const PTS_CORRECT = 10;
const PTS_WRONG = -5;
const GAME_CARD_THRESHOLD = 11;

function shuffle<T>(arr:T[]):T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function SorterClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]     = useState<Phase>("intro");
  const [items, setItems]     = useState<typeof ITEMS>([]);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ITEM);
  const [locked, setLocked]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  function stopTimer() { if(timerRef.current) clearInterval(timerRef.current); }

  function startGame() {
    setItems(shuffle(ITEMS));
    setIdx(0); setAnswers([]); setLocked(false);
    setPhase("playing");
  }

  useEffect(()=>{
    if(phase!=="playing") return;
    setTimeLeft(TIME_PER_ITEM);
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){stopTimer();handleAnswer(null);return 0;}
        return t-1;
      });
    },1000);
    return stopTimer;
  },[phase,idx]); // eslint-disable-line

  function handleAnswer(userAnswer:boolean|null) {
    if (locked) return;
    setLocked(true);
    stopTimer();
    const item=items[idx];
    const correct = userAnswer !== null && userAnswer===item.recyclable;
    const ans:Answer={id:item.id,correct,userAnswer};
    const next=[...answers,ans];
    setAnswers(next);
    setTimeout(()=>{
      setLocked(false);
      if(idx+1<items.length) setIdx(i=>i+1);
      else setPhase("results");
    },300);
  }

  useEffect(()=>{
    if(phase!=="results") return;
    const save=async()=>{
      const sb=createClient();if(!sb)return;
      const correct=answers.filter(a=>a.correct).length;
      const wrong=answers.length-correct;
      const pts=Math.max(0, correct*PTS_CORRECT - wrong*Math.abs(PTS_WRONG));
      setSaving(true);
      try{// @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:4,game_id:3,points:pts,time_seconds:0,game_cards:correct>=GAME_CARD_THRESHOLD?1:0});}catch(_){}
      setSaving(false);
    };
    save();
  },[phase]); // eslint-disable-line

  const correctCount=answers.filter(a=>a.correct).length;
  const wrongCount = answers.length - correctCount;
  const totalPts = Math.max(0, correctCount*PTS_CORRECT - wrongCount*Math.abs(PTS_WRONG));
  const passed=correctCount>=GAME_CARD_THRESHOLD;

  if(phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex gap-2">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-black text-[10px] text-center leading-tight">RECYCLE</div>
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-black text-[10px] text-center leading-tight">BIN</div>
        </div>
        <h2 className="text-[22px] font-bold text-gray-900">Waste Speed Sorter</h2>
        <p className="text-[13px] text-gray-500">Module 4 . Game 3 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format",`${ITEMS.length} items by resin code`,"Classify each item as Recyclable or Non-Recyclable"],
          ["Speed",`${TIME_PER_ITEM}s per item`,"Timer resets for each item"],
          ["Scoring","+10 correct / -5 wrong","No feedback shown until you finish all items"],
          ["Game Card",`${GAME_CARD_THRESHOLD}/${ITEMS.length} correct`,"Get at least 11 correct to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - no answers shown until finished</p>
        <p className="text-[12px] text-red-600 mt-0.5">Base your answer on the resin code, not just the product type.</p>
      </div>
      <button className="btn-primary" onClick={startGame}>Start Sorting Exam</button>
    </div>
  );

  if(phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Recycling Pro!":"Keep Studying"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/{ITEMS.length}</p>
        <p className="text-[13px] text-gray-500">{totalPts} pts ({correctCount} right, {wrongCount} wrong)</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-blue-700 mb-1">Official answer key</p>
        <p className="text-[12px] text-blue-800">Recyclable: PET (1), HDPE (2), LDPE (4), PP (5)</p>
        <p className="text-[12px] text-blue-800">Not recyclable: PVC (3), PS (6), Other (7)</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Answer Review</p></div>
        <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {answers.map((a,i)=>{
            const item=items[i];
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`text-[13px] font-bold shrink-0 ${a.correct?"text-green-600":"text-red-500"}`}>{a.correct?"+":"-"}</span>
                <p className="text-[12px] text-gray-800 flex-1">{item.label}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.recyclable?"bg-green-50 text-green-700":"bg-red-50 text-red-600"}`}>{item.recyclable?"Recyclable":"Not Recyclable"}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/4")}>Back to Module 4</button>
    </div>
  );

  const item=items[idx];
  const timerPct=(timeLeft/TIME_PER_ITEM)*100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Item {idx+1} of {items.length}</p>
        <div className={`text-[20px] font-black ${timeLeft<=3?"text-red-500 animate-pulse":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>60?"bg-green-500":timerPct>30?"bg-yellow-400":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 flex items-center justify-center min-h-[120px]">
        <p className="text-[18px] font-bold text-gray-900 text-center leading-tight">{item?.label}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>handleAnswer(true)} disabled={locked}
          className="flex-1 py-5 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-[15px] hover:bg-green-100 active:scale-95 transition-all disabled:opacity-50">
          Recyclable
        </button>
        <button onClick={()=>handleAnswer(false)} disabled={locked}
          className="flex-1 py-5 rounded-2xl border-2 border-red-300 bg-red-50 text-red-600 font-bold text-[15px] hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">
          Non-Recyclable
        </button>
      </div>
      <div className="flex gap-1">
        {items.map((_,i)=>(<div key={i} className={`flex-1 h-1.5 rounded-full ${i<idx?"bg-blue-400":i===idx?"bg-blue-600":"bg-gray-200"}`}/>))}
      </div>
    </div>
  );
}
