// @ts-nocheck
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

interface QuizOption { id:string; text:string; isCorrect:boolean; }
interface QuizQuestion { id:number; question:string; options:QuizOption[]; explanation:string; timeLimit:number; }

const QUESTIONS: QuizQuestion[] = [
  { id:1, question:"Which cardiology test typically has the LOWEST diagnostic accuracy of the three?", timeLimit:15, explanation:"A Stress Test has approximately 70% accuracy — useful as a first screening but less precise than imaging-based tests.", options:[
    {id:"a",text:"Angiogram",isCorrect:false},{id:"b",text:"Stress Test",isCorrect:true},{id:"c",text:"CT Scan",isCorrect:false},{id:"d",text:"All are equal",isCorrect:false}]},
  { id:2, question:"What is the approximate diagnostic accuracy of a Stress Test?", timeLimit:15, explanation:"A Stress Test has approximately 70% diagnostic accuracy.", options:[
    {id:"a",text:"50%",isCorrect:false},{id:"b",text:"70%",isCorrect:true},{id:"c",text:"90%",isCorrect:false},{id:"d",text:"99%",isCorrect:false}]},
  { id:3, question:"Which test offers HIGHER accuracy than a Stress Test but LOWER than an Angiogram?", timeLimit:15, explanation:"A CT Scan sits in the middle of the accuracy spectrum at approximately 90%.", options:[
    {id:"a",text:"CT Scan",isCorrect:true},{id:"b",text:"Blood pressure check",isCorrect:false},{id:"c",text:"ECG only",isCorrect:false},{id:"d",text:"Stress Test",isCorrect:false}]},
  { id:4, question:"What is the approximate diagnostic accuracy of a CT Scan for cardiac checks?", timeLimit:15, explanation:"A CT Scan has approximately 90% diagnostic accuracy.", options:[
    {id:"a",text:"70%",isCorrect:false},{id:"b",text:"99%",isCorrect:false},{id:"c",text:"90%",isCorrect:true},{id:"d",text:"60%",isCorrect:false}]},
  { id:5, question:"Which test is considered the GOLD STANDARD with the highest accuracy?", timeLimit:15, explanation:"An Angiogram has approximately 99% accuracy and is the gold standard for diagnosing coronary blockages.", options:[
    {id:"a",text:"Stress Test",isCorrect:false},{id:"b",text:"Angiogram",isCorrect:true},{id:"c",text:"CT Scan",isCorrect:false},{id:"d",text:"Home blood pressure monitor",isCorrect:false}]},
  { id:6, question:"What is the approximate diagnostic accuracy of an Angiogram?", timeLimit:15, explanation:"An Angiogram has approximately 99% diagnostic accuracy.", options:[
    {id:"a",text:"99%",isCorrect:true},{id:"b",text:"80%",isCorrect:false},{id:"c",text:"90%",isCorrect:false},{id:"d",text:"75%",isCorrect:false}]},
  { id:7, question:"Why might doctors start with a Stress Test before more invasive options?", timeLimit:20, explanation:"A Stress Test is non-invasive and serves as a useful first screening tool despite its lower accuracy.", options:[
    {id:"a",text:"It is always the most accurate test",isCorrect:false},{id:"b",text:"It is non-invasive and a good first screening tool",isCorrect:true},{id:"c",text:"It requires no doctor supervision",isCorrect:false},{id:"d",text:"It replaces the need for any other test",isCorrect:false}]},
  { id:8, question:"Why is an Angiogram considered an invasive procedure?", timeLimit:18, explanation:"An Angiogram involves inserting a catheter into blood vessels to directly visualise blockages, making it invasive but highly accurate.", options:[
    {id:"a",text:"It only uses external sensors",isCorrect:false},{id:"b",text:"It involves inserting a catheter into blood vessels",isCorrect:true},{id:"c",text:"It requires no medical equipment",isCorrect:false},{id:"d",text:"It is performed at home",isCorrect:false}]},
];

const PTS_BASE=100, PTS_SPEED=50, GAME_CARD_THRESHOLD=6, PASS_PCT=70;

type Phase="intro"|"playing"|"feedback"|"results";
interface Answer { questionId:number; selectedId:string|null; correct:boolean; timeUsed:number; points:number; }

function calcPoints(correct:boolean,timeUsed:number,timeLimit:number){
  if(!correct)return 0;
  return PTS_BASE+Math.round(PTS_SPEED*Math.max(0,1-timeUsed/timeLimit));
}

export default function AccuracyClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
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
      await sb.from("scores").upsert({team_id:teamId,module_id:6,game_id:2,points:pts,time_seconds:answers.reduce((s,a)=>s+a.timeUsed,0),game_cards:correct>=GAME_CARD_THRESHOLD?1:0});}catch(_){}
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
        <div className="flex gap-2">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-700 font-black text-[10px]">70%</div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-[10px]">90%</div>
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-black text-[10px]">99%</div>
        </div>
        <h2 className="text-[22px] font-bold text-gray-900">Diagnostic Accuracy Quiz</h2>
        <p className="text-[13px] text-gray-500">Module 6 . Game 2 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["1",`${total} questions`,"Diagnostic accuracy of Stress Test, CT Scan and Angiogram"],["2","Time limit","15-20 seconds per question"],["3","Speed bonus","Faster correct answers earn more points"],["4","Game Card",`Get ${GAME_CARD_THRESHOLD}/${total} correct to earn one`]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - one attempt only</p>
        <p className="text-[12px] text-red-600 mt-0.5">No hints provided. Apply your SHE Day cardiology training.</p>
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
      <button className="btn-primary" onClick={()=>router.push("/modules/6")}>Back to Module 6</button>
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
