// components/game/inputs/CategorizedDropzoneInput.tsx

'use client';

import { useMemo, useState } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { CategorizedDropzoneQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function CategorizedDropzoneInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'categorized_dropzone'> & { question: CategorizedDropzoneQuestion }) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { t, tx } = useLanguage();

  const shuffledItems = useMemo(
    () => stableShuffle(question.items, teamId, question.id),
    [question.items, question.id, teamId]
  );
  const unplaced = shuffledItems.filter((i) => !placements[i.id]);

  function placeInCategory(categoryId: string) {
    if (disabled || !activeItem) return;
    setPlacements((p) => ({ ...p, [activeItem]: categoryId }));
    setActiveItem(null);
  }

  function removeFromCategory(itemId: string) {
    if (disabled) return;
    setPlacements((p) => {
      const next = { ...p };
      delete next[itemId];
      return next;
    });
  }

  const itemsById = Object.fromEntries(question.items.map((i) => [i.id, i]));
  const allPlaced = question.items.every((i) => placements[i.id]);

  return (
    <div>
      <HelperText>{t('input.tapItemThenColumn')}</HelperText>

      {unplaced.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {unplaced.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveItem((cur) => (cur === item.id ? null : item.id))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeItem === item.id
                  ? 'border-[#0B2545] bg-[#0B2545] text-white'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {tx(item.label)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {question.categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            disabled={disabled || !activeItem}
            onClick={() => placeInCategory(cat.id)}
            className="min-h-[140px] rounded-xl border-2 border-dashed border-slate-200 p-2 text-left transition enabled:hover:border-[#0B2545]/40 disabled:cursor-default"
          >
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{tx(cat.label)}</p>
            <div className="space-y-1.5">
              {question.items
                .filter((i) => placements[i.id] === cat.id)
                .map((i) => (
                  <span
                    key={i.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCategory(i.id);
                    }}
                    className="block cursor-pointer rounded-lg bg-[#0B2545]/5 px-2 py-1 text-center text-[11px] font-medium text-[#0B2545]"
                  >
                    {tx(itemsById[i.id].label)} ✕
                  </span>
                ))}
            </div>
          </button>
        ))}
      </div>

      <SubmitButton disabled={!allPlaced || disabled} onClick={() => onAnswer({ placements })} />
    </div>
  );
}
