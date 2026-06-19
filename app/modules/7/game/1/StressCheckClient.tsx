// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const QUESTIONS = [
  "I have felt overwhelmed by my workload",
  "I have found it hard to concentrate on tasks",
  "I have felt physically tense (tight shoulders, headaches, jaw clenching)",
  "I have had trouble sleeping or felt tired during the day",
  "I have felt irritable or short-tempered with colleagues",
  "I have skipped meals or breaks due to work pressure",
  "I have felt anxious about upcoming deadlines or targets",
  "I have found it difficult to switch off from work after hours",
  "I have felt isolated or unsupported at work",
  "I have noticed work stress affecting my mood at home",
];

const SCALE = [
  { value:1, label:"Never" },
  { value:2, label:"Rarely" },
  { value:3, label:"Sometimes" },
  { value:4, label:"Often" },
  { value:5, label:"Always" },
];

type Phase = "intro"|"playing"|"results";

export default function StressCheckClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function selectAnswer(value:number) {
    const next = [...answers, value];
    setAnswers(next);
    if (qIndex+1 < QUESTIONS.length) setQIndex(i=>i+1);
    else finish(next);
  }

  async function finish(finalAnswers:number[]) {
    const sb = createClient();
    if (sb) {
      setSaving(true);
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:7, game_id:1, points:300, time_seconds:0, game_cards:1 });
        // @ts-ignore
      await sb.from("quiz_responses").insert({ team_id:teamId, module_id:7, game_id:1, response_data:{ answers:finalAnswers }, score:300 });
      } catch(_) {}
      setSaving(false);
    }
    setPhase("results");
  }

  const total = answers.reduce((s,a)=>s+a,0);
  const band = total<=20 ? "balanced" : total<=35 ? "moderate" : "elevated";

  const BAND_INFO: Record<string,{title:string;color:string;bg:string;message:string;tips:string[]}> = {
    balanced: {
      title:"Balanced", color:"text-green-700", bg:"bg-green-50",
      message:"Your responses suggest your current stress levels are generally manageable. Keep up the habits that are working for you.",
      tips:["Continue taking regular breaks during your workday","Keep checking in with colleagues and your team","Maintain consistent sleep and meal routines"],
    },
    moderate: {
      title:"Moderate", color:"text-yellow-700", bg:"bg-yellow-50",
      message:"Your responses suggest you may be experiencing some early signs of work-related stress. This is common and worth paying attention to.",
      tips:["Build in short breaks between tasks, even 5 minutes helps","Talk to a colleague or your supervisor about workload","Protect your personal time outside working hours","Consider light physical activity or stretching during the day"],
    },
    elevated: {
      title:"Elevated", color:"text-red-700", bg:"bg-red-50",
      message:"Your responses suggest you may be carrying a heavier load of stress right now. You don't have to manage this alone.",
      tips:["Consider speaking with your supervisor or HR about your workload","Your Employee Assistance Programme (EAP), if available, offers confidential support","Reach out to a trusted colleague, friend or family member","Prioritise rest and basic routines like sleep and meals"],
    },
  };

  if (phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-black text-blue-600">10Q</div>
        <h2 className="text-[22px] font-bold text-gray-900">Stress Self-Check</h2>
        <p className="text-[13px] text-gray-500">Module 7 . Game 1 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1","10 reflection questions","Rate how often each statement applied to you recently"],
          ["2","No right or wrong answers","This is a personal self-awareness check, not a test"],
          ["3","Private results","You will see a brief awareness summary at the end"],
          ["4","Game Card","Completing all 10 questions earns a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[12px] text-blue-800">This tool is for self-awareness only and is not a clinical diagnosis. Answer honestly based on the past two weeks.</p>
      </div>
      <button className="btn-primary" onClick={()=>setPhase("playing")}>Begin Self-Check</button>
    </div>
  );

  if (phase==="results") {
    const info = BAND_INFO[band];
    return (
      <div className="flex flex-col gap-4">
        <div className={`rounded-2xl p-6 text-center ${info.bg}`}>
          <p className={`text-[13px] font-bold uppercase tracking-wide mb-1 ${info.color}`}>Stress Awareness: {info.title}</p>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">{info.message}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Suggestions for you</p>
          <div className="flex flex-col gap-2">
            {info.tips.map((tip,i)=>(
              <div key={i} className="flex items-start gap-2">
                <span className="text-blue-600 text-[12px] font-bold shrink-0 mt-0.5">{i+1}.</span>
                <p className="text-[13px] text-gray-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
        {band==="elevated" && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-[12px] font-bold text-red-700">If you are finding things difficult</p>
            <p className="text-[12px] text-red-600 mt-0.5">Please consider speaking with HR, your manager, or a mental health professional. You do not have to navigate this alone.</p>
          </div>
        )}
        {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
        <button className="btn-primary" onClick={()=>router.push("/modules/7")}>Back to Module 7</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Question {qIndex+1} of {QUESTIONS.length}</p>
      </div>
      <div className="flex gap-1">
        {QUESTIONS.map((_,i)=>(
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i<qIndex?"bg-blue-500":i===qIndex?"bg-blue-600":"bg-gray-200"}`}/>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">In the past two weeks...</p>
        <p className="text-[16px] font-semibold text-gray-900 leading-snug">{QUESTIONS[qIndex]}</p>
      </div>
      <div className="flex flex-col gap-2">
        {SCALE.map(opt=>(
          <button key={opt.value} onClick={()=>selectAnswer(opt.value)}
            className="w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-gray-200 bg-white text-[14px] font-medium text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-between">
            <span>{opt.label}</span>
            <span className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-[11px] text-gray-400">{opt.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
