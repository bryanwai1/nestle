// components/game/inputs/VisualSortInput.tsx

'use client';

import { useMemo, useState } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { VisualSortQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';

export function VisualSortInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'visual_sort'> & { question: VisualSortQuestion }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { tx } = useLanguage();

  const allChoices = useMemo(
    () => stableShuffle([...question.correctChoices, ...question.trapChoices], teamId, question.id),
    [question.correctChoices, question.trapChoices, question.id, teamId]
  );

  function toggle(id: string) {
    if (disabled) return;
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {allChoices.map((choice) => {
          const isSelected = selected.has(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(choice.id)}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs leading-snug transition ${
                isSelected ? 'border-[#0B2545] bg-[#0B2545]/5 font-medium text-[#0B2545]' : 'border-slate-200 text-slate-700'
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border ${
                  isSelected ? 'border-[#0B2545] bg-[#0B2545] text-white' : 'border-slate-300'
                }`}
              >
                {isSelected && '✓'}
              </span>
              {tx(choice.text)}
            </button>
          );
        })}
      </div>
      <SubmitButton disabled={selected.size === 0 || disabled} onClick={() => onAnswer({ selected: [...selected] })} />
    </div>
  );
}
