// @ts-nocheck
"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const STEPS = [
  { id:"danger",    label:"Scene Safety Check",     hint:"Photograph the area showing it has been checked clear of hazards" },
  { id:"response",  label:"Response Check Pose",    hint:"Photograph the shoulder-tap and shout technique being demonstrated" },
  { id:"call",      label:"Calling Emergency Services",hint:"Photograph someone demonstrating calling 999 for help" },
  { id:"compress",  label:"Compression Position",   hint:"Photograph correct hand placement and body position for chest compressions" },
];

interface Submission { stepId:string; imageData:string; caption:string; }
type Phase = "intro"|"capture"|"results";

export default function RescueSnapshotClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]         = useState<Phase>("intro");
  const [stepIdx, setStepIdx]     = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [imageData, setImageData] = useState<string|null>(null);
  const [caption, setCaption]     = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIdx];
  const totalPts = submissions.length * 150;
  const passed = submissions.length >= STEPS.length;

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current = null;
    setCameraMode(false);
  }

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject=stream; videoRef.current.play(); }
      setCameraMode(true);
    } catch { setError("Camera unavailable - use upload instead."); }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width=videoRef.current.videoWidth; canvas.height=videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current,0,0);
    setImageData(canvas.toDataURL("image/jpeg",0.7));
    stopCamera();
  }

  function handleFile(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setImageData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function submitPhoto() {
    if (!imageData||!caption.trim()) { setError("Add a note before submitting."); return; }
    const sub:Submission={stepId:step.id,imageData,caption:caption.trim()};
    const next=[...submissions,sub];
    setSubmissions(next);
    setImageData(null); setCaption(""); setError("");
    const sb=createClient();
    if(sb){
      try { // @ts-ignore
      await sb.from("photo_submissions").insert({team_id:teamId,module_id:10,game_id:2,storage_path:`team-${teamId}/module10/${step.id}-${Date.now()}.jpg`,caption:caption.trim()}); } catch(_){}
    }
    if (stepIdx+1<STEPS.length) { setStepIdx(i=>i+1); }
    else {
      setSaving(true);
      if(sb){ try { // @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:10,game_id:2,points:next.length*150,time_seconds:0,game_cards:next.length>=STEPS.length?1:0}); } catch(_){} }
      setSaving(false);
      setPhase("results");
    }
  }

  if (phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-3xl font-black text-red-600">4x</div>
        <h2 className="text-[22px] font-bold text-gray-900">Rescue Action Snapshot</h2>
        <p className="text-[13px] text-gray-500">Module 10 . Game 2 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Demonstrate","4 rescue actions","Demonstrate and photograph each step of the emergency response"],
          ["Capture","Photograph each step","Use your camera or upload from your gallery"],
          ["Document","Add a note","Briefly describe what is shown in each photo"],
          ["Game Card","Submit all 4","Document all 4 rescue actions to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">You need to demonstrate and capture:</p>
        {STEPS.map((s,i)=>(<p key={s.id} className="text-[12px] text-red-600 mt-1"><span className="font-bold">{i+1}.</span> {s.label}</p>))}
      </div>
      <button className="btn-primary" onClick={()=>setPhase("capture")}>Start Documentation</button>
    </div>
  );

  if (phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-yellow-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-yellow-700"}`}>{passed?"Documentation Complete!":"Partial Completion"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{submissions.length}/{STEPS.length}</p>
        <p className="text-[13px] text-gray-500">steps documented . {totalPts} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Submitted Photos</p></div>
        {submissions.map((s,i)=>{
          const st=STEPS.find(x=>x.id===s.stepId);
          return (
            <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-0">
              <img src={s.imageData} alt="rescue step" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-gray-900">{st?.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.caption}</p>
                <p className="text-[11px] font-bold text-blue-700 mt-1">+150 pts</p>
              </div>
            </div>
          );
        })}
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/10")}>Back to Module 10</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 mb-1">
        {STEPS.map((_,i)=>(<div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i<stepIdx?"bg-green-500":i===stepIdx?"bg-red-600":"bg-gray-200"}`}/>))}
      </div>
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide">Step {stepIdx+1} of {STEPS.length}</p>
        <p className="text-[15px] font-bold text-gray-900 mt-0.5">{step.label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{step.hint}</p>
      </div>
      {error&&<p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>}
      {!imageData&&!cameraMode&&(
        <div className="flex flex-col gap-3">
          <div className="bg-gray-100 rounded-2xl h-48 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300">
            <p className="text-4xl font-black text-gray-300">CAM</p>
            <p className="text-[13px] text-gray-400">No photo yet</p>
          </div>
          <button className="btn-primary" onClick={startCamera}>Open Camera</button>
          <button className="w-full py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50" onClick={()=>fileRef.current?.click()}>Upload from Gallery</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
        </div>
      )}
      {cameraMode&&(
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full rounded-2xl" playsInline muted/>
          </div>
          <button className="btn-primary" onClick={capturePhoto}>Capture Photo</button>
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={stopCamera}>Cancel</button>
        </div>
      )}
      {imageData&&(
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageData} alt="captured" className="w-full rounded-2xl object-cover max-h-64"/>
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">Photo taken</div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Describe this step</label>
            <textarea className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:border-blue-400" rows={3} placeholder="What is being demonstrated in this photo?" value={caption} onChange={e=>setCaption(e.target.value)}/>
          </div>
          <button className="btn-primary" onClick={submitPhoto} disabled={!caption.trim()}>
            {stepIdx+1<STEPS.length?"Submit and Continue to Next Step":"Submit Final Step"}
          </button>
        </div>
      )}
    </div>
  );
}
