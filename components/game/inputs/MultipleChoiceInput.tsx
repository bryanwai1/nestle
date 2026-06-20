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
  // order (the wireframe's "JUMBLE UP" note), but a reload doesn't reshuffle.
  const shuffled = useMemo(
    () => stableShuffleWithIndex(question.options, teamId, question.id),
    [question.options, question.id, teamId]
  );

  return (
    <div>
      <div className="space-y-2">
        {shuffled.map(({ item, originalIndex }) => (
          <button
            key={originalIndex}
            type="button"
            disabled={disabled}
            onClick={() => setSelected(originalIndex)}
            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
              selected === originalIndex
                ? 'border-[#0B2545] bg-[#0B2545]/5 font-medium text-[#0B2545]'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            {tx(item)}
          </button>
        ))}
      </div>
      <SubmitButton
        disabled={selected === null || disabled}
        onClick={() => selected !== null && onAnswer({ selectedIndex: selected })}
      />
    </div>
  );
}
