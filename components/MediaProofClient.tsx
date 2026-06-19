"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

export interface ProofConfig {
  moduleId: number;
  gameId: number;
  title: string;
  icon: string;
  mediaType: "photo" | "video";
  memberCount: number;
  maxPointsPerMember: number;
  instructions: string[];
  techniqueCues: string[];
  videoMaxSeconds?: number;
}

interface MemberSubmission { memberLabel: string; mediaData: string; }

type Phase = "intro" | "capture" | "submitted";

export default function MediaProofClient({ config, teamId: teamIdProp = "3" }: { config: ProofConfig; teamId?: string }) {
  const router = useRouter();
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const [phase, setPhase] = useState<Phase>("intro");
  const [memberIdx, setMemberIdx] = useState(0);
  const [memberName, setMemberName] = useState("");
  const [submissions, setSubmissions] = useState<MemberSubmission[]>([]);
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const maxVideoSeconds = config.videoMaxSeconds || 8;

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraMode(false);
  }

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: config.mediaType === "video" });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraMode(true);
    } catch {
      setError("Camera unavailable. Use upload instead.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setMediaData(canvas.toDataURL("image/jpeg", 0.7));
    stopCamera();
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setMediaData(url);
      stopCamera();
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds(s => {
        if (s + 1 >= maxVideoSeconds) { stopRecording(); return maxVideoSeconds; }
        return s + 1;
      });
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

  function retake() {
    setMediaData(null);
    startCamera();
  }

  async function submitMember() {
    if (!mediaData || !memberName.trim()) { setError("Enter the member's name and capture media first."); return; }
    const sub: MemberSubmission = { memberLabel: memberName.trim(), mediaData };
    const next = [...submissions, sub];
    setSubmissions(next);
    setMediaData(null);
    setMemberName("");
    setError("");

    const sb = createClient();
    if (sb) {
      try {
        await sb.from("photo_submissions").insert({
          team_id: teamId, module_id: config.moduleId, game_id: config.gameId,
          storage_path: `team-${teamId}/module${config.moduleId}/game${config.gameId}/${sub.memberLabel}-${Date.now()}`,
          caption: `${config.title} - ${sub.memberLabel}`,
          member_label: sub.memberLabel,
          media_type: config.mediaType,
          status: "pending",
        });
      } catch (_) {}
    }

    if (memberIdx + 1 < config.memberCount) {
      setMemberIdx(i => i + 1);
    } else {
      setPhase("submitted");
    }
  }

  useEffect(() => () => { stopCamera(); if (recordTimerRef.current) clearInterval(recordTimerRef.current); }, []);

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-xl font-black text-gray-700">{config.icon}</div>
        <h2 className="text-[22px] font-bold text-gray-900">{config.title}</h2>
        <p className="text-[13px] text-gray-500">Demonstrated by all {config.memberCount} team members</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {config.instructions.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-black text-[10px] flex items-center justify-center shrink-0">{i+1}</div>
            <p className="text-[13px] font-medium text-gray-800">{ins}</p>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-blue-700 mb-2">Correct technique checklist</p>
        <div className="flex flex-col gap-1">
          {config.techniqueCues.map((c,i) => (
            <p key={i} className="text-[12px] text-blue-800 flex items-start gap-1.5"><span className="shrink-0">-</span>{c}</p>
          ))}
        </div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-yellow-800">Manually graded - up to {config.maxPointsPerMember} pts per member</p>
        <p className="text-[12px] text-yellow-700 mt-0.5">An admin will review each submission and award points. This is not auto-scored.</p>
      </div>
      <button className="btn-primary" onClick={() => setPhase("capture")}>Start Recording Member 1</button>
    </div>
  );

  if (phase === "submitted") return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-6 text-center bg-blue-50">
        <p className="text-[14px] font-bold uppercase tracking-wide mb-1 text-blue-700">Submitted for Review</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{submissions.length}/{config.memberCount}</p>
        <p className="text-[13px] text-gray-500">members documented</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 text-[12px] font-bold text-gray-600">Pending Admin Review</div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Submissions</p></div>
        {submissions.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0">
            {config.mediaType === "photo"
              ? <img src={s.mediaData} alt={s.memberLabel} className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0" />
              : <video src={s.mediaData} className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0" muted />
            }
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-gray-900">{s.memberLabel}</p>
              <p className="text-[11px] text-gray-400">Awaiting review - up to {config.maxPointsPerMember} pts</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => router.push(`/modules/${config.moduleId}`)}>Back to Module {config.moduleId}</button>
    </div>
  );

  // ---- CAPTURE PHASE ----
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 mb-1">
        {Array.from({ length: config.memberCount }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < memberIdx ? "bg-green-500" : i === memberIdx ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Member {memberIdx + 1} of {config.memberCount}</p>
        <p className="text-[13px] text-gray-700 mt-0.5">Capture {config.mediaType === "video" ? `a short video (max ${maxVideoSeconds}s)` : "a photo"} of this member demonstrating correct form.</p>
      </div>

      {error && <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>}

      {!mediaData && !cameraMode && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-100 rounded-2xl h-48 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300">
            <p className="text-4xl font-black text-gray-300">{config.mediaType === "video" ? "REC" : "CAM"}</p>
            <p className="text-[13px] text-gray-400">No {config.mediaType} yet</p>
          </div>
          <button className="btn-primary" onClick={startCamera}>Open Camera</button>
          <button className="w-full py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50" onClick={() => fileRef.current?.click()}>
            Upload {config.mediaType === "video" ? "Video" : "Photo"} from Gallery
          </button>
          <input ref={fileRef} type="file" accept={config.mediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={handleFile} />
        </div>
      )}

      {cameraMode && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full rounded-2xl" playsInline muted={config.mediaType === "photo"} />
            {recording && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> {recordSeconds}s / {maxVideoSeconds}s
              </div>
            )}
          </div>
          {config.mediaType === "photo" ? (
            <button className="btn-primary" onClick={capturePhoto}>Capture Photo</button>
          ) : recording ? (
            <button className="btn-primary bg-red-600" onClick={stopRecording}>Stop Recording</button>
          ) : (
            <button className="btn-primary" onClick={startRecording}>Start Recording</button>
          )}
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={stopCamera}>Cancel</button>
        </div>
      )}

      {mediaData && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden">
            {config.mediaType === "photo"
              ? <img src={mediaData} alt="captured" className="w-full rounded-2xl object-cover max-h-64" />
              : <video ref={playbackRef} src={mediaData} className="w-full rounded-2xl max-h-64" controls />
            }
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">Captured</div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Team member's name</label>
            <input
              className="w-full border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400"
              placeholder={`e.g. Member ${memberIdx + 1} full name`}
              value={memberName} onChange={e => setMemberName(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={submitMember} disabled={!memberName.trim()}>
            {memberIdx + 1 < config.memberCount ? "Submit and Continue to Next Member" : "Submit Final Member"}
          </button>
          <button className="w-full py-2 text-[13px] text-gray-500" onClick={retake}>Retake</button>
        </div>
      )}
    </div>
  );
}
