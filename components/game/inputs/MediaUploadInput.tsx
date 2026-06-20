// components/game/inputs/MediaUploadInput.tsx
//
// `capture="environment"` opens the rear camera directly on phones/tablets
// (the devices most teams will actually use at the event) while still
// falling back to a normal file picker on desktop. Uploads go straight to
// Supabase Storage from the browser — no server round trip for the bytes —
// then we hand the resulting public URL up to QuestionRunner.

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { MediaUploadQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

const BUCKET = 'submissions';

export function MediaUploadInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'media_upload'> & { question: MediaUploadQuestion }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, tx } = useLanguage();

  function handleFile(f: File | null) {
    setError(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (question.mediaKind === 'video' && question.maxDurationSeconds) {
      // Soft client-side hint only — actual duration is verified by the
      // facilitator during manual review, browsers don't reliably expose
      // duration before the file is loaded into a media element.
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || (question.mediaKind === 'photo' ? 'jpg' : 'mp4');
      const path = `${teamId}/${question.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onAnswer({ uploadedAt: new Date().toISOString() }, pub.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <HelperText>{tx(question.instructions)}</HelperText>

      {!file ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 hover:border-slate-400">
          <span className="text-3xl">{question.mediaKind === 'photo' ? '📷' : '🎥'}</span>
          <span>{question.mediaKind === 'photo' ? t('input.takePhoto') : t('input.recordVideo')}</span>
          <input
            type="file"
            accept={question.mediaKind === 'photo' ? 'image/*' : 'video/*'}
            capture="environment"
            className="hidden"
            disabled={disabled}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="space-y-3">
          {question.mediaKind === 'photo' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl ?? ''} alt="Your submission" className="w-full rounded-xl" />
          ) : (
            <video src={previewUrl ?? ''} controls playsInline className="w-full rounded-xl bg-slate-900" />
          )}
          <button
            type="button"
            onClick={() => handleFile(null)}
            disabled={disabled || uploading}
            className="text-xs font-medium text-slate-500 underline"
          >
            {t('input.retake')}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <SubmitButton
        disabled={!file || disabled || uploading}
        onClick={handleSubmit}
        label={uploading ? t('input.uploading') : undefined}
      />
    </div>
  );
}
