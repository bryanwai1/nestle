// components/game/inputs/MultipleChoiceInput.tsx

'use client';

import { useMemo, useState } from 'react';
import { stableShuffleWithIndex } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { MultipleChoiceQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';

export function MultipleChoiceInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'multiple_choice'> & { question: MultipleChoiceQuestion }) {
  const [selected, setSelected] = useState<number | null>(null);
  const { tx } = useLanguage();

  // Per-team stable shuffle so neighbouring teams don't see the same option
  // order, but a reload doesn't reshuffle.
  const shuffled = useMemo(
    () => stableShuffleWithIndex(question.options, teamId, question.id),
    [question.options, question.id, teamId]
  );

  return (
    <div>
      <div className="space-y-2.5">
        {shuffled.map(({ item, originalIndex }, pos) => {
          const isSel = selected === originalIndex;
          const letter = String.fromCharCode(65 + pos);
          return (
            <button
              key={originalIndex}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(originalIndex)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                isSel ? 'border-[#E4002B] bg-[#E4002B]/5' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isSel ? 'bg-[#E4002B] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {letter}
              </span>
              <span className={`flex-1 text-sm ${isSel ? 'font-semibold text-[#0B2545]' : 'text-slate-700'}`}>
                {tx(item)}
              </span>
              {isSel && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4002B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
              )}
            </button>
          );
        })}
      </div>
      <SubmitButton
        disabled={selected === null || disabled}
        onClick={() => selected !== null && onAnswer({ selectedIndex: selected })}
      />
    </div>
  );
}
