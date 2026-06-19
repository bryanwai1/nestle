// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

type Phase = "intro"|"form"|"results";
type Gender = "Male"|"Female";
type Activity = "sedentary"|"light"|"moderate"|"active"|"very";

const ACTIVITY_MULT: Record<Activity,number> = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9 };
const ACTIVITY_LABEL: Record<Activity,string> = {
  sedentary:"Sedentary (little or no exercise)",
  light:"Light (exercise 1-3 days/week)",
  moderate:"Moderate (exercise 3-5 days/week)",
  active:"Active (exercise 6-7 days/week)",
  very:"Very Active (hard exercise daily)",
};

export default function CalorieClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [weight, setWeight] = useState(60);
  const [height, setHeight] = useState(165);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<Gender>("Female");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function calcBMR(): number {
    const base = 10*weight + 6.25*height - 5*age;
    return Math.round(gender==="Male" ? base+5 : base-161);
  }

  const bmr = calcBMR();
  const tdee = Math.round(bmr * ACTIVITY_MULT[activity]);
  const maintain = tdee;
  const mildDeficit = tdee - 300;
  const activeDeficit = tdee - 500;

  async function handleSubmit() {
    setSaving(true);
    const sb = createClient();
    if (sb) {
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:5, game_id:2, points:250, time_seconds:0, game_cards:1 });
        // @ts-ignore
      await sb.from("quiz_responses").insert({ team_id:teamId, module_id:5, game_id:2, response_data:{ weight, height, age, gender, activity, bmr, tdee }, score:250 });
      } catch(_) {}
    }
    setSaving(false);
    setSubmitted(true);
    setPhase("results");
  }

  if (phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl font-black text-blue-600">BMR</div>
        <h2 className="text-[22px] font-bold text-gray-900">Calorie Calculator</h2>
        <p className="text-[13px] text-gray-500">Module 5 . Game 2 of 4</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Step 1","Enter your profile","Weight, height, age, gender and activity level"],
          ["Step 2","View your metrics","BMR (Basal Metabolic Rate) and TDEE are calculated automatically"],
          ["Step 3","See intake targets","Maintenance, mild deficit and active deficit calorie targets"],
          ["Completion","Game Card awarded","Submit your calculation to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={()=>setPhase("form")}>Open Calculator</button>
    </div>
  );

  if (phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-6 text-center bg-green-50">
        <p className="text-[14px] font-bold uppercase tracking-wide mb-1 text-green-700">Calculation Complete</p>
        <p className="text-[13px] text-gray-500">Your daily energy metrics have been saved</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-[24px] font-black text-blue-700">{bmr}</p>
          <p className="text-[11px] text-gray-400 mt-1">BMR (kcal/day)</p>
          <p className="text-[10px] text-gray-400">at rest</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-[24px] font-black text-blue-700">{tdee}</p>
          <p className="text-[11px] text-gray-400 mt-1">TDEE (kcal/day)</p>
          <p className="text-[10px] text-gray-400">with activity</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Daily Intake Targets</p></div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div><p className="text-[13px] font-semibold text-gray-900">Maintain Weight</p><p className="text-[11px] text-gray-400">No change to current weight</p></div>
          <p className="text-[16px] font-bold text-blue-700">{maintain} kcal</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div><p className="text-[13px] font-semibold text-gray-900">Mild Weight Loss</p><p className="text-[11px] text-gray-400">About 0.3kg per week</p></div>
          <p className="text-[16px] font-bold text-green-700">{mildDeficit} kcal</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div><p className="text-[13px] font-semibold text-gray-900">Active Weight Loss</p><p className="text-[11px] text-gray-400">About 0.5kg per week</p></div>
          <p className="text-[16px] font-bold text-orange-600">{activeDeficit} kcal</p>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[12px] text-blue-800">Profile used: {weight}kg, {height}cm, {age}yo {gender}, {ACTIVITY_LABEL[activity]}</p>
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/5")}>Back to Module 5</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Your Profile</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="flex justify-between text-[12px] font-semibold text-gray-700 mb-1"><span>Weight</span><span>{weight} kg</span></label>
            <input type="range" min={35} max={150} value={weight} onChange={e=>setWeight(Number(e.target.value))} className="w-full"/>
          </div>
          <div>
            <label className="flex justify-between text-[12px] font-semibold text-gray-700 mb-1"><span>Height</span><span>{height} cm</span></label>
            <input type="range" min={130} max={210} value={height} onChange={e=>setHeight(Number(e.target.value))} className="w-full"/>
          </div>
          <div>
            <label className="flex justify-between text-[12px] font-semibold text-gray-700 mb-1"><span>Age</span><span>{age} years</span></label>
            <input type="range" min={16} max={70} value={age} onChange={e=>setAge(Number(e.target.value))} className="w-full"/>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Gender</label>
            <div className="flex gap-2">
              {(["Female","Male"] as Gender[]).map(g=>(
                <button key={g} onClick={()=>setGender(g)} className={`flex-1 py-2 rounded-lg border-2 text-[13px] font-semibold transition-all ${gender===g?"border-blue-500 bg-blue-50 text-blue-700":"border-gray-200 text-gray-500"}`}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Activity Level</label>
            <select value={activity} onChange={e=>setActivity(e.target.value as Activity)} className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-800">
              {(Object.keys(ACTIVITY_LABEL) as Activity[]).map(a=>(<option key={a} value={a}>{ACTIVITY_LABEL[a]}</option>))}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-2">Live Preview</p>
        <div className="flex gap-4">
          <div><p className="text-[20px] font-black text-blue-800">{bmr}</p><p className="text-[10px] text-blue-600">BMR kcal/day</p></div>
          <div><p className="text-[20px] font-black text-blue-800">{tdee}</p><p className="text-[10px] text-blue-600">TDEE kcal/day</p></div>
        </div>
      </div>
      <button className="btn-primary" onClick={handleSubmit} disabled={submitted}>Submit My Calculation</button>
    </div>
  );
}
