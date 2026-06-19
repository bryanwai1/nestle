// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const RESIN_CODES = [
  { code:"1", name:"PET",  full:"Polyethylene Terephthalate", examples:"Water bottles, soft drink bottles" },
  { code:"2", name:"HDPE", full:"High-Density Polyethylene",   examples:"Milk jugs, shampoo bottles" },
  { code:"3", name:"PVC",  full:"Polyvinyl Chloride",          examples:"Pipes, window frames, cling wrap" },
  { code:"4", name:"LDPE", full:"Low-Density Polyethylene",    examples:"Plastic bags, squeeze bottles" },
  { code:"5", name:"PP",   full:"Polypropylene",               examples:"Yogurt containers, bottle caps" },
  { code:"6", name:"PS",   full:"Polystyrene",                 examples:"Foam cups, disposable cutlery" },
  { code:"7", name:"Other",full:"Mixed / Other Plastics",      examples:"Baby bottles, CDs, mixed plastics" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

type Phase = "intro"|"playing"|"results";
interface Match { code:string; correct:boolean; timeUsed:number; points:number; }

const TIME_LIMIT = 90;
const PTS_BASE = 100;
const PTS_SPEED = 50;
const PTS_WRONG_PENALTY = 20;

export default function ResinClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]           = useState<Phase>("intro");
  const [shuffledCodes, setShuffledCodes] = useState<string[]>([]);
  const [shuffledNames, setShuffledNames] = useState<string[]>([]);
  const [selectedCode, setSelectedCode]   = useState<string|null>(null);
  const [matched, setMatched]       = useState<string[]>([]);
  const [matches, setMatches]       = useState<Match[]>([]);
  const [wrongPair, setWrongPair]   = useState<{code:string;name:string}|null>(null);
  const [timeLeft, setTimeLeft]     = useState(TIME_LIMIT);
  const [saving, setSaving]         = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const startRef = useRef<number>(0);
  const wrongRef = useRef(0);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function startGame() {
    setShuffledCodes(shuffle(RESIN_CODES.map(r=>r.code)));
    setShuffledNames(shuffle(RESIN_CODES.map(r=>r.code)));
    setMatched([]); setMatches([]); setSelectedCode(null); setWrongPair(null);
    setTimeLeft(TIME_LIMIT); setWrongCount(0); wrongRef.current=0;
    startRef.current = Date.now();
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{ if(t<=1){stopTimer();setPhase("results");return 0;} return t-1; });
    },1000);
    setPhase("playing");
  }

  function handleCodeTap(code:string) {
    if (matched.includes(code) || wrongPair) return;
    setSelectedCode(code);
  }

  function handleNameTap(nameCode:string) {
    if (!selectedCode || matched.includes(nameCode) || wrongPair) return;
    const timeUsed = Math.round((Date.now()-startRef.current)/1000);
    if (selectedCode === nameCode) {
      const pts = PTS_BASE + Math.round(PTS_SPEED*Math.max(0,1-timeUsed/TIME_LIMIT));
      setMatched(prev=>[...prev,nameCode]);
      setMatches(prev=>[...prev,{code:nameCode,correct:true,timeUsed,points:pts}]);
      setSelectedCode(null);
      if (matched.length+1 === RESIN_CODES.length) { stopTimer(); setPhase("results"); }
    } else {
      wrongRef.current++;
      setWrongCount(wrongRef.current);
      const penalty = wrongRef.current * PTS_WRONG_PENALTY;
      setWrongPair({code:selectedCode,name:nameCode});
      setTimeout(()=>{ setWrongPair(null); setSelectedCode(null); },800);
    }
  }

  useEffect(()=>{ return stopTimer; },[]);

  async function saveResults() {
    const sb = createClient(); if (!sb) return;
    const totalPts = Math.max(0, matches.reduce((s,m)=>s+m.points,0) - wrongCount*PTS_WRONG_PENALTY);
    const passed = matched.length >= 6;
    setSaving(true);
    try { // @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:4,game_id:1,points:totalPts,time_seconds:Math.round((Date.now()-startRef.current)/1000),game_cards:passed?1:0}); } catch(_){}
    setSaving(false);
  }

  useEffect(()=>{ if(phase==="results") saveResults(); },[phase]); // eslint-disable-line

  const totalPts = Math.max(0, matches.reduce((s,m)=>s+m.points,0) - wrongCount*PTS_WRONG_PENALTY);
  const passed = matched.length >= 6;

  if (phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex gap-1.5">
          {["1","2","3","4","5","6","7"].map(n=>(
            <div key={n} className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[14px]">{n}</div>
          ))}
        </div>
        <h2 className="text-[22px] font-bold text-gray-900">7 Resin Codes Puzzle</h2>
        <p className="text-[13px] text-gray-500">Module 4 · Game 1 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format","Match code to plastic","Tap a resin number then tap its matching plastic abbreviation"],
          ["Scoring","100 pts per correct match","Speed bonus added — wrong matches cost 20 pts penalty each"],
          ["Time",`${TIME_LIMIT} seconds total`,"Match all 7 before time runs out"],
          ["Game Card","Match 6 of 7 correctly","Get at least 6 correct matches to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam — no hints provided</p>
        <p className="text-[12px] text-red-600 mt-0.5">Apply your knowledge of plastic resin classification codes.</p>
      </div>
      <button className="btn-primary" onClick={startGame}>Start Matching Exam</button>
    </div>
  );

  if (phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Resin Expert!":"Keep Studying"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{matched.length}/7</p>
        <p className="text-[13px] text-gray-500">{matched.length} matched · {wrongCount} wrong · {totalPts} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",totalPts.toLocaleString(),"text-blue-700"],["Matched",`${matched.length}/7`,passed?"text-green-700":"text-red-600"],["Errors",wrongCount.toString(),wrongCount===0?"text-green-700":"text-red-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">All 7 Resin Codes</p></div>
        {RESIN_CODES.map(r=>{
          const wasMatched = matched.includes(r.code);
          return (
            <div key={r.code} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${wasMatched?"":"bg-red-50/40"}`}>
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-[14px] flex items-center justify-center shrink-0">{r.code}</div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900">{r.name} — {r.full}</p>
                <p className="text-[11px] text-gray-500">{r.examples}</p>
              </div>
              <span className="text-[14px] font-bold shrink-0">{wasMatched?"OK":"X"}</span>
            </div>
          );
        })}
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/4")}>Back to Module 4</button>
    </div>
  );

  const timerPct = (timeLeft/TIME_LIMIT)*100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-gray-400">{matched.length}/7 matched · {wrongCount} wrong</p>
          <p className="text-[11px] text-gray-400">{selectedCode ? `Code ${selectedCode} selected — tap matching abbreviation` : "Tap a code number to begin"}</p>
        </div>
        <div className={`text-[24px] font-black ${timeLeft<=15?"text-red-500":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>50?"bg-green-500":timerPct>25?"bg-yellow-400":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      {wrongPair && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
          <p className="text-[12px] font-bold text-red-600">Wrong match — -{PTS_WRONG_PENALTY} pts penalty</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide text-center">Code Number</p>
          {shuffledCodes.map(code=>{
            const isMatched = matched.includes(code);
            const isSelected = selectedCode===code;
            const isWrong = wrongPair?.code===code;
            let cls = "w-full py-3 rounded-xl border-2 font-black text-[18px] transition-all ";
            if (isMatched) cls += "border-green-300 bg-green-50 text-green-600 opacity-40";
            else if (isWrong) cls += "border-red-400 bg-red-100 text-red-600";
            else if (isSelected) cls += "border-blue-500 bg-blue-600 text-white";
            else cls += "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-95";
            return (
              <button key={code} className={cls} disabled={isMatched} onClick={()=>handleCodeTap(code)}>{code}</button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide text-center">Plastic Type</p>
          {shuffledNames.map(code=>{
            const r = RESIN_CODES.find(x=>x.code===code)!;
            const isMatched = matched.includes(code);
            const isWrong = wrongPair?.name===code;
            let cls = "w-full py-3 rounded-xl border-2 font-bold text-[13px] transition-all ";
            if (isMatched) cls += "border-green-300 bg-green-50 text-green-600 opacity-40";
            else if (isWrong) cls += "border-red-400 bg-red-100 text-red-600";
            else if (!selectedCode) cls += "border-gray-200 bg-white text-gray-500 opacity-60";
            else cls += "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-95";
            return (
              <button key={code} className={cls} disabled={isMatched||!selectedCode} onClick={()=>handleNameTap(code)}>{r.name}</button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-400">Tap a number on the left, then tap its matching abbreviation on the right</p>
    </div>
  );
}
