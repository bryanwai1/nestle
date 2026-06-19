// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const ITEMS = [
  { id:1,  label:"White Rice",             category:"carb" },
  { id:2,  label:"Wholemeal Bread",        category:"carb" },
  { id:3,  label:"Yellow Noodles",         category:"carb" },
  { id:4,  label:"Boiled Potato",          category:"carb" },
  { id:5,  label:"Grilled Chicken Breast", category:"protein" },
  { id:6,  label:"Steamed Fish",           category:"protein" },
  { id:7,  label:"Boiled Egg",             category:"protein" },
  { id:8,  label:"Tofu",                   category:"protein" },
  { id:9,  label:"Lean Beef Slices",       category:"protein" },
  { id:10, label:"Spinach",                category:"veg" },
  { id:11, label:"Carrot Sticks",          category:"veg" },
  { id:12, label:"Broccoli",               category:"veg" },
  { id:13, label:"Apple Slices",           category:"veg" },
  { id:14, label:"Banana",                 category:"veg" },
];

const CAT_LABEL: Record<string,string> = { carb:"Carbs / Grains", protein:"Protein / Meat", veg:"Fruits & Veg" };

type Phase = "intro"|"playing"|"results";
interface Answer { id:number; correct:boolean; timeUsed:number; points:number; userCategory:string; }

const TIME_PER_ITEM = 7;
const PTS_CORRECT = 80;
const PTS_SPEED = 40;
const GAME_CARD_THRESHOLD = 11;

function shuffle<T>(arr:T[]):T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function PlateClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]     = useState<Phase>("intro");
  const [items, setItems]     = useState<typeof ITEMS>([]);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ITEM);
  const [flash, setFlash]     = useState<"correct"|"wrong"|null>(null);
  const [saving, setSaving]   = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const startRef = useRef<number>(0);

  function stopTimer() { if(timerRef.current) clearInterval(timerRef.current); }

  function startGame() {
    setItems(shuffle(ITEMS));
    setIdx(0); setAnswers([]); setFlash(null);
    setPhase("playing");
  }

  useEffect(()=>{
    if(phase!=="playing") return;
    setTimeLeft(TIME_PER_ITEM);
    startRef.current=Date.now();
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){stopTimer();handleAnswer(null);return 0;}
        return t-1;
      });
    },1000);
    return stopTimer;
  },[phase,idx]); // eslint-disable-line

  function handleAnswer(userCategory:string|null) {
    stopTimer();
    const item=items[idx];
    const timeUsed=Math.min(TIME_PER_ITEM,Math.round((Date.now()-startRef.current)/1000));
    const correct = userCategory !== null && userCategory===item.category;
    const pts = correct ? PTS_CORRECT+Math.round(PTS_SPEED*Math.max(0,1-timeUsed/TIME_PER_ITEM)) : 0;
    const ans:Answer={id:item.id,correct,timeUsed,points:pts,userCategory:userCategory??"none"};
    const next=[...answers,ans];
    setAnswers(next);
    setFlash(correct?"correct":"wrong");
    setTimeout(()=>{
      setFlash(null);
      if(idx+1<items.length) setIdx(i=>i+1);
      else setPhase("results");
    },600);
  }

  useEffect(()=>{
    if(phase!=="results") return;
    const save=async()=>{
      const sb=createClient();if(!sb)return;
      const totalPts=answers.reduce((s,a)=>s+a.points,0);
      const correct=answers.filter(a=>a.correct).length;
      setSaving(true);
      try{// @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:5,game_id:1,points:totalPts,time_seconds:answers.reduce((s,a)=>s+a.timeUsed,0),game_cards:correct>=GAME_CARD_THRESHOLD?1:0});}catch(_){}
      setSaving(false);
    };
    save();
  },[phase]); // eslint-disable-line

  const totalPts=answers.reduce((s,a)=>s+a.points,0);
  const correctCount=answers.filter(a=>a.correct).length;
  const passed=correctCount>=GAME_CARD_THRESHOLD;

  const carbCorrect    = answers.filter((a,i)=>a.correct && items[i]?.category==="carb").length;
  const proteinCorrect = answers.filter((a,i)=>a.correct && items[i]?.category==="protein").length;
  const vegCorrect     = answers.filter((a,i)=>a.correct && items[i]?.category==="veg").length;
  const carbTotal=4, proteinTotal=5, vegTotal=5;

  if(phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-black text-[10px]">CARB</div>
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-black text-[10px]">PROT</div>
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-black text-[10px]">VEG</div>
        </div>
        <h2 className="text-[22px] font-bold text-gray-900">Plate Assembler</h2>
        <p className="text-[13px] text-gray-500">Module 5 . Game 1 of 4</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format","14 food items","Classify each item into its Suku Suku Separuh food group"],
          ["Speed",`${TIME_PER_ITEM}s per item`,"Timer resets for each item"],
          ["Scoring","80 pts per correct","Speed bonus added for fast answers"],
          ["Game Card",`${GAME_CARD_THRESHOLD}/14 correct`,"Get at least 11 correct to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - no hints provided</p>
        <p className="text-[12px] text-red-600 mt-0.5">Use your knowledge of the Suku Suku Separuh plate proportions.</p>
      </div>
      <button className="btn-primary" onClick={startGame}>Start Plate Exam</button>
    </div>
  );

  if(phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Balanced Plate!":"Keep Studying"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/14</p>
        <p className="text-[13px] text-gray-500">correct . {totalPts} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",totalPts.toLocaleString(),"text-blue-700"],["Correct",`${correctCount}/14`,passed?"text-green-700":"text-red-600"],["Card",passed?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Your Suku Suku Separuh Breakdown</p>
        <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-900" style={{width:"25%"}}>1/4</div>
          <div className="bg-red-400 flex items-center justify-center text-[10px] font-bold text-red-900" style={{width:"25%"}}>1/4</div>
          <div className="bg-green-400 flex items-center justify-center text-[10px] font-bold text-green-900" style={{width:"50%"}}>1/2</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div><p className="text-[13px] font-bold text-amber-700">{carbCorrect}/{carbTotal}</p><p className="text-[10px] text-gray-400">Carbs/Grains</p></div>
          <div><p className="text-[13px] font-bold text-red-700">{proteinCorrect}/{proteinTotal}</p><p className="text-[10px] text-gray-400">Protein/Meat</p></div>
          <div><p className="text-[13px] font-bold text-green-700">{vegCorrect}/{vegTotal}</p><p className="text-[10px] text-gray-400">Fruits & Veg</p></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Answer Review</p></div>
        <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {answers.map((a,i)=>{
            const item=items[i];
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`text-[14px] font-bold shrink-0 ${a.correct?"text-green-600":"text-red-500"}`}>{a.correct?"OK":"X"}</span>
                <p className="text-[12px] text-gray-800 flex-1">{item.label}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{CAT_LABEL[item.category]}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/5")}>Back to Module 5</button>
    </div>
  );

  const item=items[idx];
  const timerPct=(timeLeft/TIME_PER_ITEM)*100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Item {idx+1} of {items.length} . {correctCount} correct so far</p>
        <div className={`text-[22px] font-black ${timeLeft<=3?"text-red-500 animate-pulse":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>60?"bg-green-500":timerPct>30?"bg-yellow-400":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <div className={`bg-white rounded-2xl border-2 p-8 flex items-center justify-center min-h-[120px] transition-colors ${flash==="correct"?"border-green-400 bg-green-50":flash==="wrong"?"border-red-400 bg-red-50":"border-gray-200"}`}>
        <p className={`text-[20px] font-bold text-center transition-colors ${flash==="correct"?"text-green-700":flash==="wrong"?"text-red-600":"text-gray-900"}`}>{item?.label}</p>
      </div>
      <p className="text-center text-[12px] text-gray-400 font-medium">Which food group does this belong to?</p>
      <div className="flex flex-col gap-2">
        <button onClick={()=>handleAnswer("carb")} disabled={flash!==null}
          className="py-4 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-700 font-bold text-[14px] hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50">
          Carbohydrates / Grains (1/4)
        </button>
        <button onClick={()=>handleAnswer("protein")} disabled={flash!==null}
          className="py-4 rounded-2xl border-2 border-red-300 bg-red-50 text-red-700 font-bold text-[14px] hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">
          Protein / Meat (1/4)
        </button>
        <button onClick={()=>handleAnswer("veg")} disabled={flash!==null}
          className="py-4 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-[14px] hover:bg-green-100 active:scale-95 transition-all disabled:opacity-50">
          Fruits & Vegetables (1/2)
        </button>
      </div>
      <div className="flex gap-1.5">
        {answers.map((a,i)=>(<div key={i} className={`flex-1 h-1.5 rounded-full ${a.correct?"bg-green-500":"bg-red-400"}`}/>))}
        {Array.from({length:items.length-answers.length}).map((_,i)=>(<div key={`e-${i}`} className="flex-1 h-1.5 rounded-full bg-gray-200"/>))}
      </div>
    </div>
  );
}
