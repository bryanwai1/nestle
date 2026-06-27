// components/game/inputs/MediaUploadInput.tsx
//
// Two modes:
//   • SINGLE (default) — one photo or one video, captured via live camera
//     (getUserMedia) or a native file input. Bytes upload straight to Supabase
//     Storage. Live camera now has a large preview, a front/back FLIP button,
//     and a mirrored selfie view so the team can frame themselves.
//   • MULTI-PHOTO — when question.photoSteps is set, the team adds one photo
//     per step on a single page (e.g. Q29 C-A-L-M). All photos upload on
//     submit; their URLs are stored in response_data.photos[] and media_url is
//     set to the first photo so existing single-media views still resolve.
//
// Either way this just collects an answer and calls onAnswer once. Grading is
// unchanged (media questions stay manual review, 10 pts).
'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { MediaUploadQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';
const BUCKET = 'submissions';
type Props = QuestionInputProps<'media_upload'> & { question: MediaUploadQuestion };
export function MediaUploadInput(props: Props) {
  const steps = props.question.photoSteps;
  if (steps && steps.length > 0) return <MultiPhotoUpload {...props} />;
  return <SingleMediaUpload {...props} />;
}
/* ------------------------------------------------------------------ */
/* MULTI-PHOTO: one photo per step, all on one page                   */
/* ------------------------------------------------------------------ */
function MultiPhotoUpload({ question, teamId, disabled, onAnswer }: Props) {
  const { t, tx } = useLanguage();
  const steps = question.photoSteps ?? [];
  const [files, setFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(
    () => () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    },
    [previews]
  );
  function pick(stepId: string, f: File | null) {
    if (!f) return;
    setPreviews((prev) => {
      if (prev[stepId]) URL.revokeObjectURL(prev[stepId]);
      return { ...prev, [stepId]: URL.createObjectURL(f) };
    });
    setFiles((prev) => ({ ...prev, [stepId]: f }));
  }
  function removePhoto(stepId: string) {
    setPreviews((prev) => {
      if (prev[stepId]) URL.revokeObjectURL(prev[stepId]);
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
    setFiles((prev) => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  }
  const done = Object.keys(files).length;
  const allDone = steps.every((s) => files[s.id]);
  async function handleSubmit() {
    if (!allDone) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const photos: Array<{ stepId: string; url: string }> = [];
      for (const s of steps) {
        const f = files[s.id];
        const ext = f.name.split('.').pop() || 'jpg';
        const path = `${teamId}/${question.id}/${s.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, {
          cacheControl: '3600',
          upsert: true,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        photos.push({ stepId: s.id, url: pub.publicUrl });
      }
      onAnswer({ uploadedAt: new Date().toISOString(), photos }, photos[0]?.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">{tx(question.instructions)}</p>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const preview = previews[s.id];
          return (
            <div key={s.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#0B2545] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-[#0B2545]">{tx(s.label)}</span>
                {preview && (
                  <span className="ml-auto text-xs font-semibold text-emerald-600">✓</span>
                )}
              </div>
              {preview ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="w-full rounded-lg" />
                  <div className="flex items-center gap-4">
                    <label className="inline-block cursor-pointer text-xs font-medium text-slate-500 underline">
                      {t('input.retake')}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={disabled || uploading}
                        onChange={(e) => pick(s.id, e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removePhoto(s.id)}
                      disabled={disabled || uploading}
                      className="text-xs font-medium text-slate-400 underline"
                    >
                      {tx({ en: 'Remove', bm: 'Buang' })}
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600 transition hover:border-[#0B2545] ${
                    disabled || uploading ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <span className="text-2xl">📷</span>
                  <span className="font-medium">{t('input.takePhoto')}</span>
                  <span className="text-xs text-slate-400">{tx({ en: 'Camera or photo library', bm: 'Kamera atau galeri' })}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={disabled || uploading}
                    onChange={(e) => pick(s.id, e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-center text-xs text-slate-400">
        {tx({ en: `${done} of ${steps.length} photos added`, bm: `${done} daripada ${steps.length} foto ditambah` })}
      </p>
      <SubmitButton
        disabled={!allDone || disabled || uploading}
        onClick={handleSubmit}
        label={uploading ? t('input.uploading') : undefined}
      />
    </div>
  );
}
/* ------------------------------------------------------------------ */
/* SINGLE: one-photo / one-video capture with big preview + flip      */
/* ------------------------------------------------------------------ */
function SingleMediaUpload({ question, teamId, disabled, onAnswer }: Props) {
  const isPhoto = question.mediaKind === 'photo';
  const { t, tx } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => stopCamera(), []); // cleanup on unmount

  function stopTracks() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }
  function stopCamera() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
    stopTracks();
    setRecording(false);
    setCameraOn(false);
    setReady(false);
    setElapsed(0);
  }
  // Open a stream for the requested facing; fall back to any camera if the
  // device can't honour the exact facingMode (common on laptops).
  async function openStream(want: 'user' | 'environment') {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: { facingMode: want }, audio: !isPhoto });
    } catch {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: !isPhoto });
    }
  }
  function attach(stream: MediaStream) {
    streamRef.current = stream;
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { /* autoplay guard */ });
      }
    }, 0);
  }
  async function startCamera(want: 'user' | 'environment' = facing) {
    setError(null);
    try {
      const stream = await openStream(want);
      stopTracks();
      setFacing(want);
      setCameraOn(true);
      attach(stream);
    } catch {
      setError(tx({ en: 'Camera not available — use “upload a file” below instead.', bm: 'Kamera tidak tersedia — guna “muat naik fail” di bawah.' }));
      setCameraOn(false);
    }
  }
  async function flipCamera() {
    if (recording) return; // don't switch mid-recording
    const next = facing === 'user' ? 'environment' : 'user';
    setReady(false);
    let stream: MediaStream | null = null;
    try { stream = await openStream(next); } catch { stream = null; }
    if (!stream) return;
    stopTracks();
    setFacing(next);
    attach(stream);
  }
  function setCaptured(f: File) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    stopCamera();
  }
  function capturePhoto() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height); // saved un-mirrored (true orientation)
    canvas.toBlob(
      (blob) => { if (blob) setCaptured(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })); },
      'image/jpeg',
      0.9
    );
  }
  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorderRef.current = rec;
    rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      setCaptured(new File([blob], `video-${Date.now()}.${ext}`, { type: mime }));
    };
    rec.start();
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        if (question.maxDurationSeconds && next >= question.maxDurationSeconds) stopRecording();
        return next;
      });
    }, 1000);
  }
  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop(); // onstop -> setCaptured -> stopCamera
    }
    setRecording(false);
  }
  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }
  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || (isPhoto ? 'jpg' : 'mp4');
      const path = `${teamId}/${question.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onAnswer({ uploadedAt: new Date().toISOString() }, pub.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">{tx(question.instructions)}</p>
      {file ? (
        <div className="space-y-3">
          {isPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl ?? ''} alt="Your submission" className="w-full rounded-xl" />
          ) : (
            <video src={previewUrl ?? ''} controls playsInline className="w-full rounded-xl bg-slate-900" />
          )}
          <button type="button" onClick={reset} disabled={uploading} className="text-xs font-medium text-slate-500 underline">
            {t('input.retake')}
          </button>
        </div>
      ) : cameraOn ? (
        <div className="space-y-3">
          <div className="relative flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setReady(true)}
              className="max-h-[70vh] w-full object-contain"
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {!ready && (
              <span className="absolute text-sm text-white/70">
                {tx({ en: 'Starting camera…', bm: 'Memulakan kamera…' })}
              </span>
            )}
            {recording && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {mm}:{ss}
              </div>
            )}
            {!recording && (
              <button
                type="button"
                onClick={flipCamera}
                className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70"
              >
                🔄 {tx({ en: 'Flip', bm: 'Tukar' })}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isPhoto ? (
              <button type="button" onClick={capturePhoto} className="flex-1 rounded-xl bg-[#E4002B] px-4 py-3 text-sm font-semibold text-white">
                {t('input.takePhoto')}
              </button>
            ) : !recording ? (
              <button type="button" onClick={startRecording} className="flex-1 rounded-xl bg-[#E4002B] px-4 py-3 text-sm font-semibold text-white">
                ● {tx({ en: 'Record', bm: 'Rakam' })}
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white">
                ■ {tx({ en: 'Stop', bm: 'Berhenti' })}
              </button>
            )}
            <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600">
              {tx({ en: 'Cancel', bm: 'Batal' })}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            {tx({ en: 'Tip: tap Flip to switch front / back camera so everyone fits in frame.', bm: 'Petua: tekan Tukar untuk bertukar kamera depan / belakang supaya semua orang masuk dalam bingkai.' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => startCamera()}
            disabled={disabled}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 text-sm text-slate-600 transition hover:border-[#0B2545]"
          >
            <span className="text-3xl">{isPhoto ? '📷' : '🎥'}</span>
            <span className="font-medium">{isPhoto ? t('input.takePhoto') : t('input.recordVideo')}</span>
            <span className="text-xs text-slate-400">{tx({ en: 'Opens your device camera', bm: 'Membuka kamera peranti anda' })}</span>
          </button>
          <label className="block cursor-pointer text-center text-xs font-medium text-slate-500 underline">
            {tx({ en: 'or upload a file instead', bm: 'atau muat naik fail sebaliknya' })}
            <input
              type="file"
              accept={isPhoto ? 'image/*' : 'video/*'}
              capture="environment"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) setCaptured(f);
              }}
            />
          </label>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <SubmitButton disabled={!file || disabled || uploading} onClick={handleSubmit} label={uploading ? t('input.uploading') : undefined} />
    </div>
  );
}
