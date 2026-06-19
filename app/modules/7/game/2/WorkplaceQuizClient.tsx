// @ts-nocheck
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

interface QuizOption { id:string; text:string; isCorrect:boolean; }
interface QuizQuestion { id:number; question:string; options:QuizOption[]; explanation:string; timeLimit:number; }

const QUESTIONS: QuizQuestion[] = [
  { id:1, question:"How does chronic stress typically affect cognitive focus at work?", timeLimit:18, explanation:"Chronic stress impairs concentration and working memory, making it harder to focus on complex tasks.", options:[
    {id:"a",text:"It has no measurable effect",isCorrect:false},{id:"b",text:"It reduces concentration and impairs focus",isCorrect:true},{id:"c",text:"It always improves focus under pressure",isCorrect:false},{id:"d",text:"It only affects focus outside work hours",isCorrect:false}]},
  { id:2, question:"What is a likely workplace consequence of sustained high stress?", timeLimit:18, explanation:"Sustained stress increases operational errors due to reduced attention and slower decision-making.", options:[
    {id:"a",text:"Fewer mistakes due to heightened alertness",isCorrect:false},{id:"b",text:"Increased operational errors",isCorrect:true},{id:"c",text:"No change in performance",isCorrect:false},{id:"d",text:"Improved long-term memory",isCorrect:false}]},
  { id:3, question:"How can chronic stress affect safety compliance on the job?", timeLimit:18, explanation:"Stress can lead to rushed decisions and skipped safety steps, reducing overall compliance.", options:[
    {id:"a",text:"It improves attention to safety procedures",isCorrect:false},{id:"b",text:"It can reduce safety compliance through rushed decisions",isCorrect:true},{id:"c",text:"It has no relationship to safety behaviour",isCorrect:false},{id:"d",text:"It only affects desk-based roles",isCorrect:false}]},
  { id:4, question:"Which is a common physical sign of workplace stress?", timeLimit:15, explanation:"Muscle tension, headaches and fatigue are common physical signs the body shows under sustained stress.", options:[
    {id:"a",text:"Improved digestion",isCorrect:false},{id:"b",text:"Muscle tension and headaches",isCorrect:true},{id:"c",text:"Increased flexibility",isCorrect:false},{id:"d",text:"Better night vision",isCorrect:false}]},
  { id:5, question:"Why are regular breaks important for managing workplace stress?", timeLimit:18, explanation:"Short breaks allow mental recovery, which helps sustain focus and reduces error rates over a shift.", options:[
    {id:"a",text:"They have no real impact on performance",isCorrect:false},{id:"b",text:"They allow mental recovery and sustain focus",isCorrect:true},{id:"c",text:"They are only useful for physical jobs",isCorrect:false},{id:"d",text:"They increase stress by interrupting flow",isCorrect:false}]},
  { id:6, question:"What effect can chronic stress have on decision-making speed and quality?", timeLimit:18, explanation:"Stress can lead to either rushed, poor-quality decisions or decision paralysis, both of which reduce performance.", options:[
    {id:"a",text:"Decisions become faster and consistently more accurate",isCorrect:false},{id:"b",text:"Decision quality often declines under sustained stress",isCorrect:true},{id:"c",text:"There is no effect on decision-making",isCorrect:false},{id:"d",text:"Stress only affects decisions made on weekends",isCorrect:false}]},
  { id:7, question:"Which workplace practice helps reduce the negative impact of stress on teams?", timeLimit:18, explanation:"Open communication about workload allows issues to be addressed before they affect safety or performance.", options:[
    {id:"a",text:"Avoiding discussion of workload concerns",isCorrect:false},{id:"b",text:"Open communication about workload and concerns",isCorrect:true},{id:"c",text:"Working through all breaks",isCorrect:false},{id:"d",text:"Ignoring team member fatigue",isCorrect:false}]},
  { id:8, question:"How does poor sleep linked to work stress typically affect next-day performance?", timeLimit:18, explanation:"Poor sleep reduces alertness and reaction time, directly affecting both performance and safety the next day.", options:[
    {id:"a",text:"It has no impact on alertness",isCorrect:false},{id:"b",text:"It reduces alertness and reaction time",isCorrect:true},{id:"c",text:"It always improves morning energy",isCorrect:false},{id:"d",text:"It only affects appetite",isCorrect:false}]},
];

const PTS_BASE=100, PTS_SPEED=50, GAME_CARD_THRESHOLD=6, PASS_PCT=70;

type Phase="intro"|"playing"|"feedback"|"results";
interface Answer { questionId:number; selectedId:string|null; correct:boolean; timeUsed:number; points:number; }

function calcPoints(correct:boolean,timeUsed:number,timeLimit:number){
  if(!correct)return 0;
  return PTS_BASE+Math.round(PTS_SPEED*Math.max(0,1-timeUsed/timeLimit));
}

export default function WorkplaceQuizClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router=useRouter();
  const [phase,setPhase]=useState<Phase>("intro");
  const [qIndex,setQIndex]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const [answers,setAnswers]=useState<Answer[]>([]);
  const [timeLeft,setTimeLeft]=useState(0);
  const [saving,setSaving]=useState(false);
  const timerRef=useRef<NodeJS.Timeout|null>(null);
  const startRef=useRef(0);
  const q=QUESTIONS[qIndex];
  const total=QUESTIONS.length;

  const stopTimer=useCallback(()=>{if(timerRef.current)clearInterval(timerRef.current);},[]);

  useEffect(()=>{
    if(phase!=="playing")return;
    setSelected(null);setTimeLeft(q.timeLimit);startRef.current=Date.now();
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{if(t<=1){stopTimer();setSelected("__timeout__");return 0;}return t-1;});
    },1000);
    return stopTimer;
  },[phase,qIndex]); // eslint-disable-line

  useEffect(()=>{
    if(selected===null)return;
    stopTimer();
    const used=Math.min(q.timeLimit,Math.round((Date.now()-startRef.current)/1000));
    const tout=selected==="__timeout__";
    const ok=!tout&&!!q.options.find(o=>o.id===selected)?.isCorrect;
    setAnswers(p=>[...p,{questionId:q.id,selectedId:tout?null:selected,correct:ok,timeUsed:used,points:calcPoints(ok,used,q.timeLimit)}]);
    setPhase("feedback");
  },[selected]); // eslint-disable-line

  useEffect(()=>{
    if(phase!=="results")return;
    const save=async()=>{
      const sb=createClient();if(!sb)return;
      const pts=answers.reduce((s,a)=>s+a.points,0);
      const correct=answers.filter(a=>a.correct).length;
      setSaving(true);
      try{// @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:7,game_id:2,points:pts,time_seconds:answers.reduce((s,a)=>s+a.timeUsed,0),game_cards:correct>=GAME_CARD_THRESHOLD?1:0});}catch(_){}
      setSaving(false);
    };
    save();
  },[phase]); // eslint-disable-line

  const pts=answers.reduce((s,a)=>s+a.points,0);
  const correct=answers.filter(a=>a.correct).length;
  const pct=answers.length?Math.round(correct/answers.length*100):0;
  const passed=pct>=PASS_PCT;
  const card=correct>=GAME_CARD_THRESHOLD;
  const lastAns=answers[answers.length-1];

  if(phase==="intro")return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-black text-blue-600">WP</div>
        <h2 className="text-[22px] font-bold text-gray-900">Workplace Stress Quiz</h2>
        <p className="text-[13px] text-gray-500">Module 7 . Game 2 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["1",`${total} questions`,"How chronic stress affects focus, errors and safety compliance"],["2","Time limit","15-18 seconds per question"],["3","Speed bonus","Faster correct answers earn more points"],["4","Game Card",`Get ${GAME_CARD_THRESHOLD}/${total} correct to earn one`]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - one attempt only</p>
        <p className="text-[12px] text-red-600 mt-0.5">No hints provided. Apply your SHE Day stress management training.</p>
      </div>
      <button className="btn-primary" onClick={()=>setPhase("playing")}>Start Exam</button>
    </div>
  );

  if(phase==="results")return(
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Passed!":"Below Passing Score"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correct}/{total}</p>
        <p className="text-[13px] text-gray-500">{pct}% correct . {pts.toLocaleString()} pts</p>
        {card&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",pts.toLocaleString(),"text-blue-700"],["Accuracy",`${pct}%`,passed?"text-green-700":"text-red-600"],["Card",card?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Answer Review</p></div>
        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {answers.map((a,i)=>{
            const qq=QUESTIONS[i],ch=qq.options.find(o=>o.id===a.selectedId);
            return(
              <li key={a.questionId} className="px-4 py-3 flex items-start gap-3">
                <span className={`mt-0.5 text-[14px] font-bold shrink-0 ${a.correct?"text-green-600":"text-red-500"}`}>{a.correct?"OK":"X"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-800 leading-snug">{qq.question}</p>
                  {!a.correct&&<p className="text-[11px] text-green-600 mt-0.5">Correct: {qq.options.find(o=>o.isCorrect)?.text}</p>}
                  {!a.correct&&ch&&<p className="text-[11px] text-red-500">You chose: {ch.text}</p>}
                </div>
                <span className="text-[11px] font-bold text-blue-700 shrink-0">{a.points>0?`+${a.points}`:"0"}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/7")}>Back to Module 7</button>
    </div>
  );

  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Question {qIndex+1} of {total}</p>
        {phase==="playing"&&<div className={`text-[20px] font-black ${timeLeft<=5?"text-red-500 animate-pulse":"text-blue-700"}`}>{timeLeft}s</div>}
        {phase==="feedback"&&<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold">{lastAns?.correct?"OK":"X"}</div>}
      </div>
      <div className="flex gap-1">
        {QUESTIONS.map((_,i)=>{
          const a=answers[i];
          const bg=i===qIndex?"bg-blue-600":i<qIndex?(a?.correct?"bg-green-500":"bg-red-500"):"bg-gray-200";
          return <div key={i} className={`flex-1 h-1.5 rounded-full ${bg}`}/>;
        })}
      </div>
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 rounded-xl">
        <span className="text-[12px] font-medium text-blue-700">Score</span>
        <span className="text-[14px] font-bold text-blue-700">{pts.toLocaleString()} pts</span>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[16px] font-semibold text-gray-900 leading-snug">{q.question}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {q.options.map(opt=>{
          let s="w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-gray-200 bg-white text-[14px] font-medium text-gray-800 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all";
          if(phase==="feedback"){
            if(opt.isCorrect)s="w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-green-500 bg-green-50 text-[14px] font-semibold text-green-700 cursor-default";
            else if(opt.id===lastAns?.selectedId&&!lastAns?.correct)s="w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-red-400 bg-red-50 text-[14px] text-red-600 cursor-default";
            else s="w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-gray-100 bg-gray-50 text-[14px] text-gray-400 cursor-default";
          }
          return<button key={opt.id} className={s} disabled={phase==="feedback"} onClick={()=>phase==="playing"&&setSelected(opt.id)}>{opt.text}</button>;
        })}
      </div>
      {phase==="feedback"&&(
        <div className={`rounded-xl p-4 ${lastAns?.correct?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200"}`}>
          <p className={`text-[13px] font-bold mb-1 ${lastAns?.correct?"text-green-700":"text-red-600"}`}>{lastAns?.correct?`Correct! +${lastAns.points} pts`:lastAns?.selectedId?"Incorrect":"Time's up"}</p>
          <p className="text-[12px] text-gray-600 leading-relaxed">{q.explanation}</p>
        </div>
      )}
      {phase==="feedback"&&<button className="btn-primary" onClick={()=>{if(qIndex+1<total){setQIndex(i=>i+1);setPhase("playing");}else setPhase("results");}}>{qIndex+1<total?"Next Question":"See Results"}</button>}
    </div>
  );
}
