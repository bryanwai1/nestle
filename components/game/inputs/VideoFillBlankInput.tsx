// components/game/inputs/VideoFillBlankInput.tsx
//
// Wireframe page 7 annotated the original MCQ mockup with "Make this fill in
// the blank" — and the brief independently notes these need fuzzy/keyword
// grading, which only makes sense for free text. So Q6-15 render the hazard
// clip plus a single text field instead of multiple-choice options.

'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { VideoIdentifyQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function VideoFillBlankInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'video_identify' | 'video_avoid'> & { question: VideoIdentifyQuestion }) {
  const [text, setText] = useState('');
  const { t } = useLanguage();

  return (
    <div>
      {question.videoUrl && (
        <video
          src={question.videoUrl}
          controls
          playsInline
          className="mb-4 aspect-video w-full rounded-xl bg-slate-900"
        />
      )}
      <HelperText>{t('input.typeAnswer')}</HelperText>
      <input
        type="text"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('input.answerPlaceholder')}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0B2545] focus:outline-none"
      />
      <SubmitButton disabled={text.trim().length === 0 || disabled} onClick={() => onAnswer({ text: text.trim() })} />
    </div>
  );
}
