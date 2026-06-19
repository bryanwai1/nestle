// @ts-nocheck
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

interface QuizOption { id:string; text:string; isCorrect:boolean; }
interface QuizQuestion { id:number; question:string; options:QuizOption[]; explanation:string; timeLimit:number; }

const QUESTIONS: QuizQuestion[] = [
  { id:1, question:"Which is a classic symptom of a heart attack?", timeLimit:18, explanation:"Chest pain or pressure, often radiating to the arm, neck or jaw, is the most recognised heart attack symptom.", options:[
    {id:"a",text:"Improved appetite",isCorrect:false},
    {id:"b",text:"Chest pain or pressure radiating to arm or jaw",isCorrect:true},
    {id:"c",text:"Increased energy levels",isCorrect:false},
    {id:"d",text:"Better sleep quality",isCorrect:false}]},
  { id:2, question:"Heart attack symptoms in women often present differently. Which is more common in women?", timeLimit:20, explanation:"Women more often report unusual fatigue, shortness of breath, or back/jaw pain rather than classic chest pain.", options:[
    {id:"a",text:"Unusual fatigue and shortness of breath",isCorrect:true},
    {id:"b",text:"Loss of appetite only",isCorrect:false},
    {id:"c",text:"Improved vision",isCorrect:false},
    {id:"d",text:"Increased flexibility",isCorrect:false}]},
  { id:3, question:"What is the FIRST action if you suspect someone is having a heart attack?", timeLimit:15, explanation:"Call emergency services (999) immediately — early medical response is the single most important factor for survival.", options:[
    {id:"a",text:"Give them food",isCorrect:false},
    {id:"b",text:"Wait to see if symptoms pass",isCorrect:false},
    {id:"c",text:"Call emergency services (999) immediately",isCorrect:true},
    {id:"d",text:"Drive them to the pharmacy",isCorrect:false}]},
  { id:4, question:"If the person is conscious while waiting for help, what should you do?", timeLimit:18, explanation:"Keep them calm, seated comfortably (not lying flat), and loosen any tight clothing around the neck and chest.", options:[
    {id:"a",text:"Make them walk around",isCorrect:false},
    {id:"b",text:"Keep them calm, seated comfortably, loosen tight clothing",isCorrect:true},
    {id:"c",text:"Give them a cold shower",isCorrect:false},
    {id:"d",text:"Leave them alone to rest",isCorrect:false}]},
  { id:5, question:"If the person becomes unresponsive and stops breathing normally, what should you do?", timeLimit:18, explanation:"Begin CPR immediately following the DRBAC sequence — every minute without intervention reduces survival chances.", options:[
    {id:"a",text:"Wait for the ambulance to arrive",isCorrect:false},
    {id:"b",text:"Begin CPR immediately",isCorrect:true},
    {id:"c",text:"Give them water",isCorrect:false},
    {id:"d",text:"Elevate their legs only",isCorrect:false}]},
  { id:6, question:"Which lifestyle factor INCREASES the risk of heart disease?", timeLimit:15, explanation:"Smoking significantly increases heart disease risk by damaging blood vessels and raising blood pressure.", options:[
    {id:"a",text:"Regular exercise",isCorrect:false},
    {id:"b",text:"Smoking",isCorrect:true},
    {id:"c",text:"Drinking enough water",isCorrect:false},
    {id:"d",text:"Adequate sleep",isCorrect:false}]},
  { id:7, question:"What does the phrase \"time is muscle\" mean in heart attack response?", timeLimit:20, explanation:"The longer treatment is delayed, the more heart muscle is permanently damaged from lack of oxygen.", options:[
    {id:"a",text:"Exercise builds muscle over time",isCorrect:false},
    {id:"b",text:"The longer treatment is delayed, the more heart muscle is damaged",isCorrect:true},
    {id:"c",text:"Muscles need time to recover after exercise",isCorrect:false},
    {id:"d",text:"Heart muscle grows stronger with age",isCorrect:false}]},
  { id:8, question:"Which group is generally at HIGHER risk of heart attack?", timeLimit:18, explanation:"People with diabetes, high blood pressure, or a family history of heart disease face elevated risk.", options:[
    {id:"a",text:"People who exercise regularly",isCorrect:false},
    {id:"b",text:"People with diabetes or high blood pressure",isCorrect:true},
    {id:"c",text:"People who eat balanced diets",isCorrect:false},
    {id:"d",text:"People who sleep 8 hours nightly",isCorrect:false}]},
  { id:9, question:"A burning chest sensation mistaken for indigestion could actually be:", timeLimit:18, explanation:"Heart attack symptoms are often mistaken for indigestion, especially when burning or pressure is felt centrally in the chest.", options:[
    {id:"a",text:"Always just indigestion, never serious",isCorrect:false},
    {id:"b",text:"A possible heart attack warning sign",isCorrect:true},
    {id:"c",text:"A sign of good digestion",isCorrect:false},
    {id:"d",text:"Unrelated to the heart",isCorrect:false}]},
  { id:10, question:"What is the recommended position for a conscious person with chest pain?", timeLimit:18, explanation:"A semi-sitting position eases breathing and reduces strain on the heart compared to lying flat.", options:[
    {id:"a",text:"Lying completely flat",isCorrect:false},
    {id:"b",text:"Standing upright",isCorrect:false},
    {id:"c",text:"Semi-sitting, comfortable position",isCorrect:true},
    {id:"d",text:"Lying face down",isCorrect:false}]},
  { id:11, question:"Which symptom combination most strongly suggests a heart attack rather than a minor issue?", timeLimit:20, explanation:"Chest pressure combined with sweating, nausea and shortness of breath together strongly suggest a cardiac event.", options:[
    {id:"a",text:"Mild headache only",isCorrect:false},
    {id:"b",text:"Chest pressure with sweating, nausea and shortness of breath",isCorrect:true},
    {id:"c",text:"Slight finger tingling only",isCorrect:false},
    {id:"d",text:"Dry skin",isCorrect:false}]},
  { id:12, question:"Why should you stay with the person after calling emergency services?", timeLimit:18, explanation:"Their condition can change rapidly — staying allows you to monitor them and begin CPR immediately if needed.", options:[
    {id:"a",text:"It is not necessary to stay",isCorrect:false},
    {id:"b",text:"To monitor their condition and respond if it worsens",isCorrect:true},
    {id:"c",text:"Only to keep them company socially",isCorrect:false},
    {id:"d",text:"To take photos for records",isCorrect:false}]},
];

const PTS_BASE=100, PTS_SPEED=50, GAME_CARD_THRESHOLD=10, PASS_PCT=70;

type Phase="intro"|"playing"|"feedback"|"results";
interface Answer { questionId:number; selectedId:string|null; correct:boolean; timeUsed:number; points:number; }

function calcPoints(correct:boolean,timeUsed:number,timeLimit:number){
  if(!correct)return 0;
  return PTS_BASE+Math.round(PTS_SPEED*Math.max(0,1-timeUsed/timeLimit));
}

export default function HeartQuizClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
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
      await sb.from("scores").upsert({team_id:teamId,module_id:6,game_id:1,points:pts,time_seconds:answers.reduce((s,a)=>s+a.timeUsed,0),game_cards:correct>=GAME_CARD_THRESHOLD?1:0});}catch(_){}
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
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-3xl font-black text-red-600">HA</div>
        <h2 className="text-[22px] font-bold text-gray-900">Heart Attack Assessment Quiz</h2>
        <p className="text-[13px] text-gray-500">Module 6 . Game 1 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["1",`${total} questions`,"Symptom recognition, risk factors and emergency first aid"],["2","Time limit","15-20 seconds per question"],["3","Speed bonus","Faster correct answers earn more points"],["4","Game Card",`Get ${GAME_CARD_THRESHOLD}/${total} correct to earn one`]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-[11px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - one attempt only</p>
        <p className="text-[12px] text-red-600 mt-0.5">No hints provided. Apply your SHE Day heart health training.</p>
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
                  {!a.correct&&!ch&&<p className="text-[11px] text-gray-400 italic">timed out</p>}
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
