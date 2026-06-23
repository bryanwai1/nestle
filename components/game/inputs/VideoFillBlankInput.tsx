// components/game/inputs/VideoFillBlankInput.tsx
//
// Video questions. For two-part "identify" clips (q6-q10) we show the video on
// top and TWO labelled boxes below: "What is wrong?" and "How to avoid?".
// They are combined into one stored answer ("1) … 2) …") so grading and
// answer-keys keep working. Single-answer "avoid" questions (q4) keep one box.

'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { VideoIdentifyQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';

export function VideoFillBlankInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'video_identify' | 'video_avoid'> & { question: VideoIdentifyQuestion }) {
  const { t, tx } = useLanguage();
  const twoPart = question.responseType !== 'video_avoid';

  const [wrong, setWrong] = useState('');
  const [avoid, setAvoid] = useState('');
  const [single, setSingle] = useState('');

  const canSubmit = twoPart
    ? wrong.trim().length > 0 && avoid.trim().length > 0
    : single.trim().length > 0;

  function submit() {
    if (twoPart) {
      onAnswer({ text: `1) ${wrong.trim()}  2) ${avoid.trim()}` });
    } else {
      onAnswer({ text: single.trim() });
    }
  }

  const boxClass =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0B2545] focus:outline-none';

  return (
    <div>
      {question.videoUrl && (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <span aria-hidden>▶</span>
            {tx({ en: 'Watch the video', bm: 'Tonton video' })}
          </p>
          <video
            src={question.videoUrl}
            controls
            playsInline
            className="mb-5 aspect-video w-full rounded-xl bg-slate-900"
          />
        </>
      )}

      {twoPart ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              1) {tx({ en: 'What is wrong here?', bm: 'Apakah yang salah di sini?' })}
            </label>
            <textarea
              rows={2}
              value={wrong}
              disabled={disabled}
              onChange={(e) => setWrong(e.target.value)}
              placeholder={t('input.answerPlaceholder')}
              className={boxClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              2) {tx({ en: 'How can the driver avoid this?', bm: 'Bagaimana pemandu boleh elakkan ini?' })}
            </label>
            <textarea
              rows={2}
              value={avoid}
              disabled={disabled}
              onChange={(e) => setAvoid(e.target.value)}
              placeholder={t('input.answerPlaceholder')}
              className={boxClass}
            />
          </div>
        </div>
      ) : (
        <input
          type="text"
          value={single}
          disabled={disabled}
          onChange={(e) => setSingle(e.target.value)}
          placeholder={t('input.answerPlaceholder')}
          className={boxClass}
        />
      )}

      <SubmitButton disabled={!canSubmit || disabled} onClick={submit} />
    </div>
  );
}
