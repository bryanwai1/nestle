// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const PROMPTS = [
  { id:"symptoms",   label:"Overstress Symptoms",           placeholder:"What signs of overstress have you or your team noticed at work?" },
  { id:"resilience", label:"Stress Resilience Methods",      placeholder:"What methods has your team used to build resilience against stress?" },
  { id:"coping",     label:"Long-Term Coping Blueprint",     placeholder:"What long-term plan will your team follow to manage workplace stress?" },
];

type Phase = "intro"|"form"|"results";

export default function ReflectionClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string,string>>({ symptoms:"", resilience:"", coping:"" });
  const [saving, setSaving] = useState(false);

  const allFilled = PROMPTS.every(p => answers[p.id].trim().length > 0);

  async function handleSubmit() {
    setSaving(true);
    const sb = createClient();
    if (sb) {
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:7, game_id:3, points:300, time_seconds:0, game_cards:1 });
        // @ts-ignore
      await sb.from("quiz_responses").insert({ team_id:teamId, module_id:7, game_id:3, response_data:answers, score:300 });
      } catch(_) {}
    }
    setSaving(false);
    setPhase("results");
  }

  if (phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-black text-blue-600">RC</div>
        <h2 className="text-[22px] font-bold text-gray-900">Reflection Console</h2>
        <p className="text-[13px] text-gray-500">Module 7 . Game 3 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format","3 team prompts","Discuss and write your team's collective response to each prompt"],
          ["Purpose","Shared awareness","Turn today's learning into practical team habits"],
          ["Completion","Game Card awarded","Submit all 3 reflections to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={()=>setPhase("form")}>Start Reflection</button>
    </div>
  );

  if (phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-6 text-center bg-green-50">
        <p className="text-[14px] font-bold uppercase tracking-wide mb-1 text-green-700">Reflections Saved</p>
        <p className="text-[13px] text-gray-500">Your team's responses have been recorded</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Your Team's Reflections</p></div>
        {PROMPTS.map(p=>(
          <div key={p.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
            <p className="text-[12px] font-bold text-gray-700 mb-1">{p.label}</p>
            <p className="text-[13px] text-gray-600 leading-relaxed">{answers[p.id]}</p>
          </div>
        ))}
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/7")}>Back to Module 7</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {PROMPTS.map(p=>(
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="text-[13px] font-bold text-gray-900 mb-2 block">{p.label}</label>
          <textarea
            className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 resize-none focus:outline-none focus:border-blue-400"
            rows={3} placeholder={p.placeholder}
            value={answers[p.id]} onChange={e=>setAnswers(prev=>({...prev,[p.id]:e.target.value}))}
          />
        </div>
      ))}
      <button className="btn-primary" onClick={handleSubmit} disabled={!allFilled}>Submit Team Reflections</button>
    </div>
  );
}
