// components/game/inputs/DragSequenceInput.tsx
//
// Native HTML5 drag-and-drop doesn't fire reliably on touch devices, and
// most teams at this event will be on phones/tablets. Up/down reordering
// gives the same "put these steps in order" interaction with zero
// cross-device flakiness — visually it's still presented as a stack of
// draggable-looking cards, just moved with buttons instead of a pointer drag.
//
// Cards can carry an optional photo (step.imageUrl), and the question can show
// an optional context image (question.imageUrl) above the list — both are
// purely decorative. The order the team submits is unchanged.

'use client';

import { useState } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { DragSequenceQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function DragSequenceInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'drag_sequence'> & { question: DragSequenceQuestion }) {
  const [order, setOrder] = useState(() => stableShuffle(question.steps, teamId, question.id).map((s) => s.id));
  const { t, tx } = useLanguage();

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  const stepsById = Object.fromEntries(question.steps.map((s) => [s.id, s]));
  const contextImage = (question as DragSequenceQuestion & { imageUrl?: string }).imageUrl;

  return (
    <div>
      {contextImage && (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <img src={contextImage} alt="" className="max-h-60 w-full object-cover" />
        </div>
      )}

      <HelperText>{t('input.arrangeSteps')}</HelperText>

      <div className="space-y-2">
        {order.map((id, i) => {
          const step = stepsById[id] as { id: string; label: { en: string; bm: string }; imageUrl?: string };
          return (
            <div
              key={id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#0B2545] text-xs font-semibold text-white">
                {i + 1}
              </span>
              {step.imageUrl && (
                <img
                  src={step.imageUrl}
                  alt=""
                  className="h-14 w-20 flex-none rounded-lg border border-slate-100 object-cover"
                />
              )}
              <span className="flex-1 text-sm text-slate-700">{tx(step.label)}</span>
              <div className="flex flex-none flex-col gap-0.5">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded border border-slate-200 px-2 text-xs leading-5 text-slate-500 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={disabled || i === order.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded border border-slate-200 px-2 text-xs leading-5 text-slate-500 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <SubmitButton disabled={disabled} onClick={() => onAnswer({ order })} />
    </div>
  );
}
