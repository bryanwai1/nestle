// components/game/inputs/ClassificationMatrixInput.tsx
//
// Two-box classification drag (tap-to-place). For Q32 (plastic recycling)
// the categories carry recycling icons; for Q19 (heart conditions) they carry
// emoji. Each category box auto-shows its icon via the label text.

'use client';

import { useMemo, useState } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { ClassificationMatrixQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

/** Colour scheme per category id — works for both Q19 and Q32 */
const CATEGORY_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  heart_attack:    { bg: 'bg-red-50',   ring: 'ring-red-400',   text: 'text-red-800'   },
  cardiac_arrest:  { bg: 'bg-blue-50',  ring: 'ring-blue-400',  text: 'text-blue-800'  },
  recyclable:      { bg: 'bg-green-50', ring: 'ring-green-500', text: 'text-green-800' },
  non_recyclable:  { bg: 'bg-red-50',   ring: 'ring-red-400',   text: 'text-red-800'   },
};

/** Recycling-type icons for the plastic chips */
const PLASTIC_ICON: Record<string, { symbol: string; color: string }> = {
  pet:    { symbol: '①', color: '#22c55e' },
  hdpe:   { symbol: '②', color: '#16a34a' },
  pvc:    { symbol: '③', color: '#dc2626' },
  ldpe:   { symbol: '④', color: '#86efac' },
  pp:     { symbol: '⑤', color: '#4ade80' },
  ps:     { symbol: '⑥', color: '#f87171' },
  others: { symbol: '⑦', color: '#9ca3af' },
};

export function ClassificationMatrixInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'classification_matrix'> & { question: ClassificationMatrixQuestion }) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { t, tx } = useLanguage();

  const shuffledItems = useMemo(
    () => stableShuffle(question.items, teamId, question.id),
    [question.items, question.id, teamId]
  );
  const unplaced   = shuffledItems.filter((i) => !placements[i.id]);
  const itemsById  = Object.fromEntries(question.items.map((i) => [i.id, i]));
  const allPlaced  = question.items.every((i) => placements[i.id]);

  function placeInCategory(categoryId: string) {
    if (disabled || !activeItem) return;
    setPlacements((p) => ({ ...p, [activeItem]: categoryId }));
    setActiveItem(null);
  }

  function removeFromCategory(itemId: string) {
    if (disabled) return;
    setPlacements((p) => { const n = { ...p }; delete n[itemId]; return n; });
  }

  const isPlasticModule = question.categories.some((c) => c.id === 'recyclable' || c.id === 'non_recyclable');

  return (
    <div>
      <HelperText>{t('input.tapItemThenCategory')}</HelperText>

      {/* Unplaced chips */}
      {unplaced.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {unplaced.map((item) => {
            const plastic = isPlasticModule ? PLASTIC_ICON[item.id] : null;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setActiveItem((cur) => (cur === item.id ? null : item.id))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  activeItem === item.id
                    ? 'border-[#0B2545] bg-[#0B2545] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {plastic && (
                  <span style={{ color: activeItem === item.id ? 'white' : plastic.color }}>
                    {plastic.symbol}
                  </span>
                )}
                {tx(item.label)}
              </button>
            );
          })}
        </div>
      )}

      {/* Two drop boxes */}
      <div className="grid grid-cols-2 gap-3">
        {question.categories.map((cat) => {
          const colors = CATEGORY_COLORS[cat.id] ?? { bg: 'bg-slate-50', ring: 'ring-slate-300', text: 'text-slate-700' };
          const placed = question.items.filter((i) => placements[i.id] === cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled || !activeItem}
              onClick={() => placeInCategory(cat.id)}
              className={`min-h-[160px] rounded-2xl border-2 border-dashed p-3 text-left transition ${
                colors.bg
              } ${
                activeItem && !disabled
                  ? `cursor-pointer border-current ${colors.text} ring-2 ${colors.ring}`
                  : 'border-slate-200'
              }`}
            >
              <p className={`mb-3 text-center text-sm font-bold ${colors.text}`}>{tx(cat.label)}</p>
              {isPlasticModule && placed.length === 0 && (
                <div className="flex justify-center text-3xl opacity-20">
                  {cat.id === 'recyclable' ? '♻️' : '🚫'}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-1.5">
                {placed.map((i) => {
                  const plastic = isPlasticModule ? PLASTIC_ICON[i.id] : null;
                  return (
                    <span
                      key={i.id}
                      onClick={(e) => { e.stopPropagation(); removeFromCategory(i.id); }}
                      className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}
                    >
                      {plastic && <span style={{ color: plastic.color }}>{plastic.symbol}</span>}
                      {tx(itemsById[i.id].label)} ✕
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">
        {Object.keys(placements).length} / {question.items.length} sorted
      </p>

      <SubmitButton disabled={!allPlaced || disabled} onClick={() => onAnswer({ placements })} />
    </div>
  );
}
