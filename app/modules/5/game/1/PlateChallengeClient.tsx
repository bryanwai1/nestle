// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FOODS, SECTION_CAPS, BUDGET_MAX, MEAL_KCAL_MIN, MEAL_KCAL_MAX, TOTAL_TIME_SECONDS, BMR_QUESTION, type FoodItem } from "./plate-data";
import { useTeam } from "@/lib/useTeam";

type Phase = "intro" | "calc" | "building" | "results";
type Group = "carb" | "protein" | "veg";

const GROUP_LABEL: Record<Group,string> = { carb:"Carbs / Grains (1/4)", protein:"Protein / Meat (1/4)", veg:"Fruits & Vegetables (1/2)" };
const GROUP_BG: Record<Group,string> = { carb:"bg-amber-50 border-amber-200", protein:"bg-red-50 border-red-200", veg:"bg-green-50 border-green-200" };
const GROUP_TEXT: Record<Group,string> = { carb:"text-amber-700", protein:"text-red-700", veg:"text-green-700" };

export default function PlateChallengeClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [calcSelected, setCalcSelected] = useState<string | null>(null);
  const [plate, setPlate] = useState<Record<Group,string[]>>({ carb:[], protein:[], veg:[] });
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function startChallenge() {
    setPhase("calc");
    setTimeLeft(TOTAL_TIME_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t<=1) { stopTimer(); finishChallenge(); return 0; } return t-1; });
    }, 1000);
  }

  function selectCalc(id: string) {
    if (calcSelected) return;
    setCalcSelected(id);
    setPhase("building");
  }

  const cost = (Object.values(plate).flat() as string[]).reduce((s,id)=>s + (FOODS.find(f=>f.id===id)?.price||0), 0);
  const kcal = (Object.values(plate).flat() as string[]).reduce((s,id)=>s + (FOODS.find(f=>f.id===id)?.kcal||0), 0);

  function addFood(food: FoodItem) {
    const current = plate[food.group];
    if (current.length >= SECTION_CAPS[food.group]) return;
    if (cost + food.price > BUDGET_MAX) return;
    setPlate(prev => ({ ...prev, [food.group]: [...prev[food.group], food.id] }));
  }

  function removeFood(group: Group, index: number) {
    setPlate(prev => {
      const next = [...prev[group]];
      next.splice(index, 1);
      return { ...prev, [group]: next };
    });
  }

  function finishChallenge() {
    stopTimer();
    setPhase("results");
  }

  const calcCorrect = calcSelected === BMR_QUESTION.options.find(o=>o.isCorrect)?.id;
  const sectionsFilled = (Object.keys(plate) as Group[]).filter(g => plate[g].length > 0).length;
  const withinBudget = cost <= BUDGET_MAX;
  const withinKcal = kcal >= MEAL_KCAL_MIN && kcal <= MEAL_KCAL_MAX;

  const calcPts = calcCorrect ? 150 : -75;
  const sectionPts = sectionsFilled * 100;
  const budgetPts = withinBudget ? 100 : 0;
  const kcalPts = withinKcal ? 150 : 0;
  const totalPts = Math.max(0, calcPts + sectionPts + budgetPts + kcalPts);
  const passed = calcCorrect && sectionsFilled === 3 && withinBudget && withinKcal;

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:5, game_id:1, points:totalPts, time_seconds:TOTAL_TIME_SECONDS-timeLeft, game_cards:passed?1:0 });
      } catch(_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  useEffect(() => () => stopTimer(), []);

  // ---- INTRO ----
  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-xl font-black text-blue-600">1/2+1/4+1/4</div>
        <h2 className="text-[22px] font-bold text-gray-900">Suku Suku Separuh Challenge</h2>
        <p className="text-[13px] text-gray-500">Module 5 . Game 1 of 2</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1","Answer the calorie question","One quick calculation, then it locks in"],
          ["2","Build your plate","Tap food photos to fill 1/2 veg+fruit and 2x 1/4 carb/protein sections"],
          ["3","Stay within RM12.00","Running budget tracker - can't add if it goes over"],
          ["4","2-minute combined timer","Covers both the question and the plate - move fast"],
        ].map(([i,l,s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - one attempt only</p>
        <p className="text-[12px] text-red-600 mt-0.5">No hints, no retries. Each section has a realistic serving limit.</p>
      </div>
      <button className="btn-primary" onClick={startChallenge}>Start Challenge</button>
    </div>
  );

  // ---- RESULTS ----
  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Balanced Plate Achieved!":"Incomplete Challenge"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{totalPts} pts</p>
        {passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Calorie Question</p></div>
        <div className="px-4 py-3">
          <p className="text-[12px] text-gray-700 mb-2">{BMR_QUESTION.question}</p>
          {calcSelected ? (
            <>
              <p className={`text-[12px] font-bold ${calcCorrect?"text-green-600":"text-red-500"}`}>
                You answered: {BMR_QUESTION.options.find(o=>o.id===calcSelected)?.text} {calcCorrect?"(Correct)":"(Incorrect)"}
              </p>
              {!calcCorrect && <p className="text-[12px] text-green-600 mt-0.5">Correct answer: {BMR_QUESTION.options.find(o=>o.isCorrect)?.text}</p>}
            </>
          ) : <p className="text-[12px] text-gray-400 italic">Not answered (time expired)</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className={`text-[18px] font-bold ${withinBudget?"text-green-700":"text-red-600"}`}>RM{cost.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">of RM{BUDGET_MAX.toFixed(2)} budget</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className={`text-[18px] font-bold ${withinKcal?"text-green-700":"text-orange-500"}`}>{kcal} kcal</p>
          <p className="text-[11px] text-gray-400 mt-0.5">target {MEAL_KCAL_MIN}-{MEAL_KCAL_MAX}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Your Plate ({sectionsFilled}/3 sections filled)</p>
        {(Object.keys(plate) as Group[]).map(g => (
          <div key={g} className="mb-3 last:mb-0">
            <p className={`text-[11px] font-bold mb-1 ${GROUP_TEXT[g]}`}>{GROUP_LABEL[g]}</p>
            {plate[g].length === 0
              ? <p className="text-[11px] text-gray-400 italic">Empty</p>
              : <p className="text-[12px] text-gray-700">{plate[g].map(id=>FOODS.find(f=>f.id===id)?.name).join(", ")}</p>
            }
          </div>
        ))}
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/5")}>Back to Module 5</button>
    </div>
  );

  // ---- CALC PHASE ----
  const timerPct = (timeLeft/TOTAL_TIME_SECONDS)*100;
  if (phase === "calc") return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Step 1 of 2 - Calorie Calculation</p>
        <div className={`text-[16px] font-black ${timeLeft<=20?"text-red-500":"text-blue-700"}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>30?"bg-blue-500":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Profile: 60kg . 165cm</p>
        <p className="text-[15px] font-semibold text-gray-900 leading-snug">{BMR_QUESTION.question}</p>
      </div>
      <div className="flex flex-col gap-2">
        {BMR_QUESTION.options.map(opt => (
          <button key={opt.id} onClick={()=>selectCalc(opt.id)}
            className="w-full text-left px-4 py-3 rounded-xl border-[1.5px] border-gray-200 bg-white text-[13.5px] font-medium text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all">
            <span className="inline-block w-5 font-bold text-[11px] text-gray-400 mr-1.5">{opt.id.toUpperCase()}.</span>
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );

  // ---- BUILDING PHASE (the plate) ----
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Step 2 of 2 - Build Your Plate</p>
        <div className={`text-[16px] font-black ${timeLeft<=20?"text-red-500 animate-pulse":"text-blue-700"}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>30?"bg-blue-500":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>

      {/* Live budget + kcal bar */}
      <div className="flex gap-2">
        <div className={`flex-1 rounded-xl px-3 py-2 border ${cost<=BUDGET_MAX?"bg-blue-50 border-blue-100":"bg-red-50 border-red-200"}`}>
          <p className="text-[10px] text-gray-500">Budget</p>
          <p className={`text-[15px] font-bold ${cost<=BUDGET_MAX?"text-blue-700":"text-red-600"}`}>RM{cost.toFixed(2)} / {BUDGET_MAX.toFixed(2)}</p>
        </div>
        <div className="flex-1 rounded-xl px-3 py-2 border bg-gray-50 border-gray-100">
          <p className="text-[10px] text-gray-500">Calories</p>
          <p className="text-[15px] font-bold text-gray-700">{kcal} kcal</p>
        </div>
      </div>

      {/* The literal round plate */}
      <div className="flex justify-center my-6">
        <div className="relative w-[280px] h-[280px] rounded-full border-[12px] border-gray-100 shadow-[0_10px_25px_rgba(0,0,0,0.1)] overflow-hidden flex bg-white">
          <div className={`w-1/2 h-full border-r-[4px] border-gray-100 p-3 flex flex-col items-center justify-center transition-colors ${GROUP_BG.veg}`}>
            <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-3 text-center ${GROUP_TEXT.veg}`}>Veg & Fruit</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {plate.veg.length === 0 && <span className="text-[10px] font-semibold opacity-40">Empty (1/2)</span>}
              {plate.veg.map((id,i) => {
                const f = FOODS.find(x=>x.id===id);
                return <button key={i} onClick={()=>removeFood("veg",i)} className="text-[10px] bg-white border border-green-300 text-green-700 rounded-full px-2.5 py-1 shadow-sm font-bold active:scale-90 transition-transform">{f?.name.split(" ")[0]} ✕</button>;
              })}
            </div>
          </div>
          <div className="w-1/2 h-full flex flex-col">
            <div className={`h-1/2 border-b-[4px] border-gray-100 p-3 flex flex-col items-center justify-center transition-colors ${GROUP_BG.carb}`}>
              <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-2 ${GROUP_TEXT.carb}`}>Carbs</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {plate.carb.length === 0 && <span className="text-[9px] font-semibold opacity-40">Empty (1/4)</span>}
                {plate.carb.map((id,i) => {
                  const f = FOODS.find(x=>x.id===id);
                  return <button key={i} onClick={()=>removeFood("carb",i)} className="text-[9px] bg-white border border-amber-300 text-amber-700 rounded-full px-2 py-1 shadow-sm font-bold active:scale-90 transition-transform">{f?.name.split(" ")[0]} ✕</button>;
                })}
              </div>
            </div>
            <div className={`h-1/2 p-3 flex flex-col items-center justify-center transition-colors ${GROUP_BG.protein}`}>
              <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-2 ${GROUP_TEXT.protein}`}>Protein</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {plate.protein.length === 0 && <span className="text-[9px] font-semibold opacity-40">Empty (1/4)</span>}
                {plate.protein.map((id,i) => {
                  const f = FOODS.find(x=>x.id===id);
                  return <button key={i} onClick={()=>removeFood("protein",i)} className="text-[9px] bg-white border border-red-300 text-red-700 rounded-full px-2 py-1 shadow-sm font-bold active:scale-90 transition-transform">{f?.name.split(" ")[0]} ✕</button>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Food picker - tap photos to add */}
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Tap a food to add it to the plate</p>
      <div className="grid grid-cols-3 gap-2">
        {FOODS.map(food => {
          const full = plate[food.group].length >= SECTION_CAPS[food.group];
          const overBudget = cost + food.price > BUDGET_MAX;
          const disabled = full || overBudget;
          return (
            <button
              key={food.id}
              onClick={() => addFood(food)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${disabled ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed" : "border-gray-200 bg-white hover:border-blue-400 active:scale-95"}`}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[9px] font-bold text-white text-center leading-tight" style={{ background: food.color }}>
                PHOTO
              </div>
              <p className="text-[10px] font-semibold text-gray-800 text-center leading-tight">{food.name}</p>
              <p className="text-[9px] text-gray-400">RM{food.price.toFixed(2)} . {food.kcal}kcal</p>
              {full && <p className="text-[8px] text-red-500 font-bold">Section full</p>}
              {!full && overBudget && <p className="text-[8px] text-red-500 font-bold">Over budget</p>}
            </button>
          );
        })}
      </div>

      <button className="btn-primary" onClick={finishChallenge}>Submit Plate</button>
    </div>
  );
}
