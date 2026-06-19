// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const PREP_SECONDS = 20 * 60;
const MAX_VIDEO_SECONDS = 180;
const MAX_POINTS = 40;

type Phase = "intro" | "capture" | "submitted";

export default function DrillClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  function startPrepTimer() {
    prepTimerRef.current = setInterval(() => {
      setPrepLeft(t => { if (t <= 1) { if (prepTimerRef.current) clearInterval(prepTimerRef.current); return 0; } return t - 1; });
    }, 1000);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraMode(false);
  }

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraMode(true);
    } catch {
      setError("Camera unavailable. Use upload instead.");
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setMediaData(URL.createObjectURL(blob));
      stopCamera();
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds(s => { if (s + 1 >= MAX_VIDEO_SECONDS) { stopRecording(); return MAX_VIDEO_SECONDS; } return s + 1; });
    }, 1000);
  }

  function stopRecording() {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setMediaData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!mediaData) { setError("Record or upload your drill video first."); return; }
    const sb = createClient();
    setSaving(true);
    if (sb) {
      try {
        // @ts-ignore
      await sb.from("photo_submissions").insert({
          team_id: teamId, module_id: 10, game_id: 2,
          storage_path: `team-${teamId}/module10/game2/drill-${Date.now()}`,
          caption: `Medical Response Drill${note ? " - " + note : ""}`,
          member_label: "Whole Team",
          media_type: "video",
          status: "pending",
        });
      } catch (_) {}
    }
    setSaving(false);
    setPhase("submitted");
  }

  useEffect(() => () => { stopCamera(); if (prepTimerRef.current) clearInterval(prepTimerRef.current); if (recordTimerRef.current) clearInterval(recordTimerRef.current); }, []);

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-xl font-black text-red-600">CALM</div>
        <h2 className="text-[22px] font-bold text-gray-900">Medical Response Drill</h2>
        <p className="text-[13px] text-gray-500">Module 10 . Game 2 of 4</p>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4">
        <p className="text-[12px] font-bold text-orange-800 mb-1">Scenario</p>
        <p className="text-[13px] text-orange-900 leading-relaxed">A staff member suddenly complains of chest pain, difficulty breathing, sweating, and dizziness. As a full team, act out how you would respond.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Follow the C-A-L-M framework</p></div>
        {[
          ["C", "Call", "Call emergency services immediately"],
          ["A", "Assist", "Help the person sit down comfortably"],
          ["L", "Look", "Continuously monitor their condition"],
          ["M", "Move to CPR", "If they collapse and stop breathing normally, begin CPR"],
        ].map(([l, t, s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-[16px] flex items-center justify-center shrink-0">{l}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{t}</p><p className="text-[12px] text-gray-500">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-yellow-800">Manually graded - up to {MAX_POINTS} pts</p>
        <p className="text-[12px] text-yellow-700 mt-0.5">Max video length: 3 minutes. You have 20 minutes total to plan and film. An admin reviews and scores this submission.</p>
      </div>
      <button className="btn-primary" onClick={() => { setPhase("capture"); startPrepTimer(); }}>Start Drill</button>
    </div>
  );

  if (phase === "submitted") return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-6 text-center bg-blue-50">
        <p className="text-[14px] font-bold uppercase tracking-wide mb-1 text-blue-700">Drill Submitted</p>
        <p className="text-[13px] text-gray-500">Your medical response drill has been recorded</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 text-[12px] font-bold text-gray-600">Pending Admin Review - up to {MAX_POINTS} pts</div>
      </div>
      <button className="btn-primary" onClick={() => router.push("/modules/10")}>Back to Module 10</button>
    </div>
  );

  const prepMin = Math.floor(prepLeft / 60), prepSec = prepLeft % 60;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
        <p className="text-[12px] text-gray-500">Time to plan and film</p>
        <p className={`text-[16px] font-black ${prepLeft <= 120 ? "text-red-500" : "text-blue-700"}`}>{prepMin}:{String(prepSec).padStart(2,"0")}</p>
      </div>
      {error && <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>}

      {!mediaData && !cameraMode && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-100 rounded-2xl h-48 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300">
            <p className="text-4xl font-black text-gray-300">REC</p>
            <p className="text-[13px] text-gray-400">No video yet</p>
          </div>
          <button className="btn-primary" onClick={startCamera}>Open Camera</button>
          <button className="w-full py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50" onClick={() => fileRef.current?.click()}>Upload Video from Gallery</button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {cameraMode && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full rounded-2xl" playsInline />
            {recording && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> {recordSeconds}s / {MAX_VIDEO_SECONDS}s
              </div>
            )}
          </div>
          {recording ? (
            <button className="btn-primary bg-red-600" onClick={stopRecording}>Stop Recording</button>
          ) : (
            <button className="btn-primary" onClick={startRecording}>Start Recording</button>
          )}
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={stopCamera}>Cancel</button>
        </div>
      )}

      {mediaData && (
        <div className="flex flex-col gap-3">
          <video src={mediaData} className="w-full rounded-2xl max-h-64" controls />
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Optional note for the admin reviewer</label>
            <textarea className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:border-blue-400" rows={2} placeholder="Anything you want the reviewer to know..." value={note} onChange={e=>setNote(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={submit}>Submit Drill</button>
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={() => { setMediaData(null); startCamera(); }}>Re-record</button>
        </div>
      )}
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
    </div>
  );
}
