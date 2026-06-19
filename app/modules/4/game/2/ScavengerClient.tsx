// @ts-nocheck
"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const CATEGORIES = [
  { id:"pet",    label:"PET Plastic Item",          hint:"Find any item with recycling code 1 — e.g. water or drink bottle" },
  { id:"hdpe",   label:"HDPE Plastic Item",         hint:"Find any item with recycling code 2 — e.g. shampoo or detergent bottle" },
  { id:"bag",    label:"Plastic Bag or Film",       hint:"Find any plastic bag, wrapper or plastic film packaging" },
  { id:"rigid",  label:"Rigid Food Container",      hint:"Find any plastic food tub, takeaway container or yogurt cup" },
  { id:"single", label:"Single-Use Plastic Item",   hint:"Find any single-use plastic — straw, cutlery, cup or stirrer" },
];

interface Submission { categoryId:string; imageData:string; caption:string; }
type Phase = "intro"|"capture"|"results";

export default function ScavengerClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase]         = useState<Phase>("intro");
  const [catIdx, setCatIdx]       = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [imageData, setImageData] = useState<string|null>(null);
  const [caption, setCaption]     = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const category = CATEGORIES[catIdx];
  const totalPts = submissions.length * 120;
  const passed = submissions.length >= CATEGORIES.length;

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
    } catch { setError("Camera unavailable — use upload instead."); }
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
    if (!imageData||!caption.trim()) { setError("Add a caption before submitting."); return; }
    const sub:Submission={categoryId:category.id,imageData,caption:caption.trim()};
    const next=[...submissions,sub];
    setSubmissions(next);
    setImageData(null); setCaption(""); setError("");
    const sb=createClient();
    if(sb){
      try { // @ts-ignore
      await sb.from("photo_submissions").insert({team_id:teamId,module_id:4,game_id:2,storage_path:`team-${teamId}/module4/${category.id}-${Date.now()}.jpg`,caption:caption.trim()}); } catch(_){}
    }
    if (catIdx+1<CATEGORIES.length) { setCatIdx(i=>i+1); }
    else {
      setSaving(true);
      if(sb){ try { // @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:4,game_id:2,points:next.length*120,time_seconds:0,game_cards:next.length>=CATEGORIES.length?1:0}); } catch(_){} }
      setSaving(false);
      setPhase("results");
    }
  }

  if (phase==="intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl font-black text-blue-600">5x</div>
        <h2 className="text-[22px] font-bold text-gray-900">Plastic Scavenger Hunt</h2>
        <p className="text-[13px] text-gray-500">Module 4 · Game 2 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Hunt","5 plastic categories","Find and photograph one real plastic item for each category"],
          ["Caption","Describe each item","Explain what type of plastic it is and why it matters"],
          ["Points","120 pts per photo","Up to 600 pts total for completing all 5"],
          ["Game Card","Submit all 5","Photograph all 5 categories to earn a Game Card"],
        ].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-blue-800 mb-2">You need to find:</p>
        {CATEGORIES.map((c,i)=>(
          <p key={c.id} className="text-[12px] text-blue-800 mb-1"><span className="font-bold">{i+1}.</span> {c.label}</p>
        ))}
      </div>
      <button className="btn-primary" onClick={()=>setPhase("capture")}>Start Hunt</button>
    </div>
  );

  if (phase==="results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-yellow-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-yellow-700"}`}>{passed?"Hunt Complete!":"Partial Completion"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{submissions.length}/{CATEGORIES.length}</p>
        <p className="text-[13px] text-gray-500">photos submitted · {totalPts} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Submitted Photos</p></div>
        {submissions.map((s,i)=>{
          const cat=CATEGORIES.find(c=>c.id===s.categoryId);
          return (
            <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-0">
              <img src={s.imageData} alt="plastic" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-gray-900">{cat?.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.caption}</p>
                <p className="text-[11px] font-bold text-blue-700 mt-1">+120 pts</p>
              </div>
            </div>
          );
        })}
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/4")}>Back to Module 4</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 mb-1">
        {CATEGORIES.map((_,i)=>(
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i<catIdx?"bg-green-500":i===catIdx?"bg-blue-600":"bg-gray-200"}`}/>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Item {catIdx+1} of {CATEGORIES.length}</p>
        <p className="text-[15px] font-bold text-gray-900 mt-0.5">{category.label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{category.hint}</p>
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
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Describe this plastic item</label>
            <textarea className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:border-blue-400" rows={3} placeholder="What plastic type is this? What is the resin code? Why does it matter?" value={caption} onChange={e=>setCaption(e.target.value)}/>
          </div>
          <button className="btn-primary" onClick={submitPhoto} disabled={!caption.trim()}>
            {catIdx+1<CATEGORIES.length?"Submit and Find Next Item":"Submit Final Photo"}
          </button>
        </div>
      )}
    </div>
  );
}
