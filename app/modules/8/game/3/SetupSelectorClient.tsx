// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const SETUPS = [
  { id:1,  label:"Monitor at eye level, arm's length away",            correct:true  },
  { id:2,  label:"Screen tilted upward, viewed from below",            correct:false },
  { id:3,  label:"Chair with adjustable lumbar support engaged",       correct:true  },
  { id:4,  label:"Sitting on the very edge of the chair, unsupported", correct:false },
  { id:5,  label:"Feet flat on the floor, knees at 90 degrees",        correct:true  },
  { id:6,  label:"Feet dangling, chair set too high",                  correct:false },
  { id:7,  label:"Wrists straight and level while typing",             correct:true  },
  { id:8,  label:"Wrists bent sharply upward against desk edge",       correct:false },
  { id:9,  label:"Elbows close to body at roughly 90 degrees",         correct:true  },
  { id:10, label:"Shoulders raised and tense while reaching forward",  correct:false },
];

const TIME_LIMIT = 90;
const PTS_PER_CORRECT = 60;
const PENALTY_PER_WRONG = 30;
const GAME_CARD_THRESHOLD = 4;

type Phase = "intro"|"playing"|"results";

function shuffle<T>(arr:T[]):T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function SetupSelectorClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [items, setItems] = useState<typeof SETUPS>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [saving, setSaving] = useState(false);
  const [finalStats, setFinalStats] = useState<{correctTicked:number;wrongTicked:number;missedCorrect:number;points:number;passed:boolean}|null>(null);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  function stopTimer() { if(timerRef.current) clearInterval(timerRef.current); }

  function startGame() {
    setItems(shuffle(SETUPS));
    setSelected([]);
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{ if(t<=1){stopTimer();submitAnswers();return 0;} return t-1; });
    },1000);
    setPhase("playing");
  }

  function toggle(id:number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  }

  async function submitAnswers() {
    stopTimer();
    const correctIds = SETUPS.filter(s=>s.correct).map(s=>s.id);
    const correctTicked = selected.filter(id=>correctIds.includes(id)).length;
    const wrongTicked = selected.filter(id=>!correctIds.includes(id)).length;
    const missedCorrect = correctIds.filter(id=>!selected.includes(id)).length;
    const points = Math.max(0, correctTicked*PTS_PER_CORRECT - wrongTicked*PENALTY_PER_WRONG);
    const passed = correctTicked>=GAME_CARD_THRESHOLD && wrongTicked===0;
    setFinalStats({ correctTicked, wrongTicked, missedCorrect, points, passed });

    const sb = createClient();
    if (sb) {
      setSaving(true);
      try { // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:8, game_id:3, points, time_seconds:TIME_LIMIT-timeLeft, game_cards:passed?1:0 }); } catch(_) {}
      setSaving(false);
    }
    setPhase("results");
  }

  useEffect(()=>{ return stopTimer; },[]);

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-black text-gray-700">TICK</div>
        <h2 className="text-[22px] font-bold text-gray-900">Tick the Right Setup</h2>
        <p className="text-[13px] text-gray-500">Module 8 . Game 3 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format",`${SETUPS.length} posture descriptions`,"Tick only the ones that describe CORRECT ergonomic setup"],
          ["Scoring","60 pts per correct tick","Wrong ticks cost a 30 pt penalty each"],
          ["Time",`${TIME_LIMIT/60} minutes`,"Single submission only - choose carefully"],
          ["Game Card",`${GAME_CARD_THRESHOLD}+ correct, zero wrong`,"Tick at least 4 correct setups with no wrong ticks"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - one submission only</p>
        <p className="text-[12px] text-red-600 mt-0.5">Review carefully before submitting. There is no retry.</p>
      </div>
      <button className="btn-primary" onClick={startGame}>Start Selection Exam</button>
    </div>
  );

  if (phase === "results" && finalStats) return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${finalStats.passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${finalStats.passed?"text-green-700":"text-red-600"}`}>{finalStats.passed?"Setup Expert!":"Keep Studying"}</p>
        <p className="text-[28px] font-black text-gray-900 leading-none mb-1">{finalStats.points} pts</p>
        {finalStats.passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-[18px] font-bold text-green-700">{finalStats.correctTicked}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">correct ticked</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-[18px] font-bold text-red-600">{finalStats.wrongTicked}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">wrong ticked</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-[18px] font-bold text-orange-500">{finalStats.missedCorrect}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">missed</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">All Setups Reviewed</p></div>
        {items.map(s=>{
          const wasTicked = selected.includes(s.id);
          const ok = wasTicked === s.correct;
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0">
              <span className={`text-[14px] font-bold shrink-0 ${ok?"text-green-600":"text-red-500"}`}>{ok?"OK":"X"}</span>
              <p className="text-[12px] text-gray-800 flex-1">{s.label}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.correct?"bg-green-50 text-green-700":"bg-red-50 text-red-600"}`}>{s.correct?"Correct":"Incorrect"}</span>
            </div>
          );
        })}
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/8")}>Back to Module 8</button>
    </div>
  );

  const timerPct = (timeLeft/TIME_LIMIT)*100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">{selected.length} setups ticked</p>
        <div className={`text-[18px] font-black ${timeLeft<=15?"text-red-500":"text-blue-700"}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>30?"bg-blue-500":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[12px] text-blue-800">Tick every description that shows CORRECT ergonomic setup. Leave incorrect ones unticked.</p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map(s=>{
          const isSel = selected.includes(s.id);
          return (
            <button key={s.id} onClick={()=>toggle(s.id)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${isSel?"border-blue-400 bg-blue-50":"border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSel?"border-blue-500 bg-blue-500":"border-gray-300"}`}>
                {isSel && <span className="text-white text-[11px] font-bold">OK</span>}
              </div>
              <p className="text-[13px] font-medium text-gray-900 flex-1">{s.label}</p>
            </button>
          );
        })}
      </div>
      <button className="btn-primary" onClick={submitAnswers}>Submit Final Selection</button>
    </div>
  );
}
