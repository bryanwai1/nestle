// components/game/inputs/HazardCanvasInput.tsx
//
// Coordinates are stored as percentages of the rendered image's width/height
// (not pixels), so a tap recorded on a phone lines up correctly when an
// admin reviews it later on a desktop monitor at a different image size.

'use client';

import { useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { HazardCanvasQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function HazardCanvasInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'hazard_canvas'> & { question: HazardCanvasQuestion }) {
  const [taps, setTaps] = useState<Array<{ x: number; y: number }>>([]);
  const imgRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTaps((t) => [...t, { x, y }]);
  }

  function undoLast() {
    setTaps((t) => t.slice(0, -1));
  }

  return (
    <div>
      <HelperText>{t('input.tapHazardHint', { count: taps.length, target: question.targetHazardCount })}</HelperText>

      <div
        ref={imgRef}
        onClick={handleTap}
        className="relative w-full cursor-crosshair overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
        style={{ aspectRatio: '4 / 3' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={question.imageUrl} alt="Spot the hazards" className="h-full w-full object-cover" draggable={false} />
        {taps.map((t, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#E4002B] text-center text-[10px] font-bold leading-5 text-white shadow"
            style={{ left: `${t.x}%`, top: `${t.y}%`, width: 20, height: 20 }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={undoLast} disabled={taps.length === 0 || disabled} className="text-xs font-medium text-slate-500 underline disabled:opacity-40">
          {t('input.undoLastTap')}
        </button>
        <button type="button" onClick={() => setTaps([])} disabled={taps.length === 0 || disabled} className="text-xs font-medium text-slate-500 underline disabled:opacity-40">
          {t('input.clearAll')}
        </button>
      </div>

      <SubmitButton disabled={taps.length === 0 || disabled} onClick={() => onAnswer({ taps })} />
    </div>
  );
}
