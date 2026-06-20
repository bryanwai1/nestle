// components/game/inputs/BudgetCanvasInput.tsx
//
// The running cost/calorie totals shown here are the player's OWN arithmetic
// (what they've placed costs how much) — that's instrumental, like a
// shopping cart subtotal, not a correctness judgement against the answer
// key. So showing it live doesn't violate the "no feedback" rule; whether
// their plate actually nails Suku-Suku Separuh proportions is still for a
// facilitator to judge (requiresManualReview: true on this question).

'use client';

import { useMemo, useState } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { BudgetCanvasQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function BudgetCanvasInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'budget_canvas'> & { question: BudgetCanvasQuestion }) {
  const [placements, setPlacements] = useState<Array<{ foodId: string; quadrant: string }>>([]);
  const [activeFood, setActiveFood] = useState<string | null>(null);
  const { t, tx } = useLanguage();

  const shuffledCards = useMemo(
    () => stableShuffle(question.foodCards, teamId, question.id),
    [question.foodCards, question.id, teamId]
  );
  const placedIds = new Set(placements.map((p) => p.foodId));
  const cardsById = Object.fromEntries(question.foodCards.map((f) => [f.id, f]));

  const totalCost = placements.reduce((s, p) => s + cardsById[p.foodId].costRM, 0);
  const totalCalories = placements.reduce((s, p) => s + cardsById[p.foodId].calories, 0);
  const overBudget = totalCost > question.budgetLimitRM;

  function place(quadrant: string) {
    if (disabled || !activeFood) return;
    setPlacements((p) => [...p, { foodId: activeFood, quadrant }]);
    setActiveFood(null);
  }

  function removePlacement(foodId: string) {
    if (disabled) return;
    setPlacements((p) => p.filter((x) => x.foodId !== foodId));
  }

  return (
    <div>
      <HelperText>{t('input.tapFoodThenPlate', { limit: question.budgetLimitRM.toFixed(2) })}</HelperText>

      <div
        className={`mb-3 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium ${
          overBudget ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
        }`}
      >
        <span>
          RM{totalCost.toFixed(2)} / RM{question.budgetLimitRM.toFixed(2)}
          {placements.length > 0 && ` (${overBudget ? t('input.overBudget') : t('input.withinBudget')})`}
        </span>
        <span>{totalCalories} kcal</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {shuffledCards
          .filter((c) => !placedIds.has(c.id))
          .map((card) => (
            <button
              key={card.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveFood((cur) => (cur === card.id ? null : card.id))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeFood === card.id
                  ? 'border-[#0B2545] bg-[#0B2545] text-white'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {tx(card.label)} · RM{card.costRM.toFixed(2)}
            </button>
          ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {question.quadrants.map((q) => (
          <button
            key={q.id}
            type="button"
            disabled={disabled || !activeFood}
            onClick={() => place(q.id)}
            className={`min-h-[110px] rounded-xl border-2 border-dashed border-slate-200 p-2 text-left transition enabled:hover:border-[#0B2545]/40 ${
              q.id === 'veg_fruit' ? 'col-span-2' : ''
            }`}
          >
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tx(q.label)} ({Math.round(q.fraction * 100)}%)
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {placements
                .filter((p) => p.quadrant === q.id)
                .map((p) => (
                  <span
                    key={p.foodId}
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlacement(p.foodId);
                    }}
                    className="cursor-pointer rounded-lg bg-[#0B2545]/5 px-2 py-1 text-[11px] font-medium text-[#0B2545]"
                  >
                    {tx(cardsById[p.foodId].label)} ✕
                  </span>
                ))}
            </div>
          </button>
        ))}
      </div>

      <SubmitButton
        disabled={placements.length === 0 || disabled}
        onClick={() => onAnswer({ placements, totalCostRM: totalCost, totalCalories })}
      />
    </div>
  );
}
