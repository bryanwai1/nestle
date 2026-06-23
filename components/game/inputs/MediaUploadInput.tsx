// components/game/inputs/MediaUploadInput.tsx
//
// Capture works two ways:
//   1. LIVE CAMERA via getUserMedia — works on laptops/desktops too (Capture
//      a photo to canvas, or record video with MediaRecorder).
//   2. Fallback file input with capture="environment" — phones open the
//      native camera; desktops without camera permission get a file picker.
// Either way the bytes upload straight to Supabase Storage from the browser.

'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { MediaUploadQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';

const BUCKET = 'submissions';

export function MediaUploadInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'media_upload'> & { question: MediaUploadQuestion }) {
  const isPhoto = question.mediaKind === 'photo';
  const { t, tx } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopCamera(), []); // cleanup on unmount

  function stopCamera() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setRecording(false);
    setCameraOn(false);
    setElapsed(0);
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: !isPhoto,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { /* autoplay guard */ });
        }
      }, 0);
    } catch {
      setError('Camera not available — use “upload a file” below instead.');
      setCameraOn(false);
    }
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
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
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
          <div className="relative overflow-hidden rounded-xl bg-slate-900">
            <video ref={videoRef} playsInline muted className="w-full" />
            {recording && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {mm}:{ss}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {isPhoto ? (
              <button type="button" onClick={capturePhoto} className="flex-1 rounded-xl bg-[#E4002B] px-4 py-3 text-sm font-semibold text-white">
                {t('input.takePhoto')}
              </button>
            ) : !recording ? (
              <button type="button" onClick={startRecording} className="flex-1 rounded-xl bg-[#E4002B] px-4 py-3 text-sm font-semibold text-white">
                ● Record
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white">
                ■ Stop
              </button>
            )}
            <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 text-sm text-slate-600 transition hover:border-[#0B2545]"
          >
            <span className="text-3xl">{isPhoto ? '📷' : '🎥'}</span>
            <span className="font-medium">{isPhoto ? t('input.takePhoto') : t('input.recordVideo')}</span>
            <span className="text-xs text-slate-400">Opens your device camera</span>
          </button>
          <label className="block cursor-pointer text-center text-xs font-medium text-slate-500 underline">
            or upload a file instead
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
