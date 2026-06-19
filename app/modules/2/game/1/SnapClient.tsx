// @ts-nocheck
"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const CATEGORIES = [
  { id:"cable",   label:"Loose Cable / Wire",       icon:"🔌", hint:"Find a cable crossing a walkway or loose on the floor" },
  { id:"spill",   label:"Liquid Spill / Wet Floor",  icon:"💧", hint:"Find a spill, wet surface or area without a wet floor sign" },
  { id:"block",   label:"Blocked Pathway / Exit",    icon:"🚧", hint:"Find a doorway, aisle or exit blocked by objects" },
];

interface Submission { categoryId: string; imageData: string; caption: string; }

type Phase = "intro"|"capture"|"results";

export default function SnapClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [catIdx, setCatIdx] = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [imageData, setImageData] = useState<string|null>(null);
  const [caption, setCaption] = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const category = CATEGORIES[catIdx];
  const totalPts = submissions.length * 150;
  const passed = submissions.length >= CATEGORIES.length;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraMode(false);
  }, []);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"environment" }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraMode(true);
    } catch {
      setError("Camera not available. Use the upload button instead.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setImageData(canvas.toDataURL("image/jpeg", 0.7));
    stopCamera();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImageData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function retake() { setImageData(null); setCaption(""); startCamera(); }

  async function submitPhoto() {
    if (!imageData || !caption.trim()) { setError("Please add a caption before submitting."); return; }
    const sub: Submission = { categoryId: category.id, imageData, caption: caption.trim() };
    const next = [...submissions, sub];
    setSubmissions(next);
    setImageData(null);
    setCaption("");
    setError("");
    const sb = createClient();
    if (sb) {
      try {
        // @ts-ignore
      await sb.from("photo_submissions").insert({ team_id:teamId, module_id:2, game_id:1, storage_path:`team-${teamId}/module2/${category.id}-${Date.now()}.jpg`, caption:caption.trim() });
      } catch(_) {}
    }
    if (catIdx + 1 < CATEGORIES.length) setCatIdx(i => i + 1);
    else { await saveScore(next); setPhase("results"); }
  }

  async function saveScore(subs: Submission[]) {
    const sb = createClient(); if (!sb) return;
    setSaving(true);
    try { // @ts-ignore
      await sb.from("scores").upsert({ team_id:teamId, module_id:2, game_id:1, points:subs.length*150, time_seconds:0, game_cards:subs.length>=CATEGORIES.length?1:0 }); } catch(_) {}
    setSaving(false);
  }

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-5xl">📸</div>
        <h2 className="text-[22px] font-bold text-gray-900">Snap & Upload</h2>
        <p className="text-[13px] text-gray-500">Module 2 · Game 1 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["📍","Hunt in your venue","Find real STF hazards around your office or event space"],["📸","Photograph each one","Use your camera or upload from your gallery"],["✍️","Explain the hazard","Type why it is dangerous and what should be done"],["🃏","Game Card","Submit all 3 hazard types to earn a Game Card"]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <span className="text-xl mt-0.5">{i}</span>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-orange-700 mb-1">📋 You need to photograph:</p>
        {CATEGORIES.map(c=><p key={c.id} className="text-[12px] text-orange-800 flex items-center gap-2"><span>{c.icon}</span>{c.label}</p>)}
      </div>
      <button className="btn-primary" onClick={()=>setPhase("capture")}>Start Hunt ▶</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-yellow-50"}`}>
        <div className="text-5xl mb-3">{passed?"🏆":"📸"}</div>
        <p className={`text-[13px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-yellow-700"}`}>{passed?"All Hazards Found!":"Good Effort"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{submissions.length}/{CATEGORIES.length}</p>
        <p className="text-[13px] text-gray-500">photos submitted · {totalPts} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">🃏 Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Submitted Photos</p></div>
        {submissions.map((s,i)=>{
          const cat = CATEGORIES.find(c=>c.id===s.categoryId);
          return (
            <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-0">
              <img src={s.imageData} alt="hazard" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-gray-900">{cat?.icon} {cat?.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.caption}</p>
                <p className="text-[11px] font-bold text-blue-700 mt-1">+150 pts</p>
              </div>
            </div>
          );
        })}
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving…</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/2")}>← Back to Module 2</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 mb-1">
        {CATEGORIES.map((c,i)=>(
          <div key={c.id} className={`flex-1 h-1.5 rounded-full transition-colors ${i<catIdx?"bg-green-500":i===catIdx?"bg-red-500":"bg-gray-200"}`}/>
        ))}
      </div>
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide">Hazard {catIdx+1} of {CATEGORIES.length}</p>
        <p className="text-[15px] font-bold text-gray-900 mt-0.5">{category.icon} {category.label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{category.hint}</p>
      </div>
      {error&&<p className="text-[12px] text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {!imageData && !cameraMode && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-100 rounded-2xl h-48 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300">
            <span className="text-4xl">📷</span>
            <p className="text-[13px] text-gray-500">No photo yet</p>
          </div>
          <button className="btn-primary" onClick={startCamera}>📸 Open Camera</button>
          <button className="w-full py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors" onClick={()=>fileRef.current?.click()}>📁 Upload from Gallery</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
        </div>
      )}
      {cameraMode && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full rounded-2xl" playsInline muted/>
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none"/>
          </div>
          <button className="btn-primary" onClick={capturePhoto}>📸 Capture Photo</button>
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={stopCamera}>Cancel</button>
        </div>
      )}
      {imageData && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageData} alt="captured hazard" className="w-full rounded-2xl object-cover max-h-64"/>
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">✓ Photo taken</div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Describe this hazard ✍️</label>
            <textarea
              className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 resize-none focus:outline-none focus:border-blue-400 transition-colors"
              rows={3} placeholder="Why is this dangerous? What should be done to fix it?"
              value={caption} onChange={e=>setCaption(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={submitPhoto} disabled={!caption.trim()}>
            {catIdx+1<CATEGORIES.length?`Submit & Find Next Hazard →`:"Submit Final Photo →"}
          </button>
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={retake}>Retake Photo</button>
        </div>
      )}
    </div>
  );
}
