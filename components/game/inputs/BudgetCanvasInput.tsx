// components/game/inputs/BudgetCanvasInput.tsx
//
// Redesigned with:
//  1. An SVG Suku-Suku Separuh plate graphic that shows placed food items
//  2. Food emoji icons on every card so players can visually identify food
//  3. Running cost/calorie counter (not a correctness hint — just a shopping cart total)

'use client';

import { useMemo, useState } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { BudgetCanvasQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

// ---- emoji lookup keyed on the food card id --------------------------------
const FOOD_EMOJI: Record<string, string> = {
  f1: '🥦', f2: '🍌', f3: '🍎', f4: '🍉',
  f5: '🍗', f6: '🥚', f7: '🐟', f8: '🫘',
  f9: '🍚', f10: '🍞', f11: '🍠',
};

// ---- Plate SVG (Suku-Suku Separuh) ----------------------------------------
// Drawn at 200×200. The plate is divided:
//   Top half (50%) = Vegetables + Fruit  — light green
//   Bottom-left quarter (25%) = Protein  — salmon/orange
//   Bottom-right quarter (25%) = Carbs   — golden yellow
// A dividing line runs horizontally and then vertically in the lower half.

const PLATE_SIZE = 200;
const CX = PLATE_SIZE / 2;
const CY = PLATE_SIZE / 2;
const R  = 90; // circle radius

function polarToXY(angleDeg: number, r = R) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

// Sector path: from angle startDeg to endDeg
function sectorPath(startDeg: number, endDeg: number) {
  const s = polarToXY(startDeg);
  const e = polarToXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

// Centroid of a sector for placing the label
function sectorCentroid(startDeg: number, endDeg: number, r = R * 0.6) {
  const mid = (startDeg + endDeg) / 2;
  return polarToXY(mid, r);
}

interface PlateSection { id: string; startDeg: number; endDeg: number; fill: string; stroke: string }
const PLATE_SECTIONS: PlateSection[] = [
  { id: 'veg_fruit', startDeg: 0,   endDeg: 180, fill: '#d1fae5', stroke: '#6ee7b7' }, // top half
  { id: 'protein',   startDeg: 180, endDeg: 270, fill: '#fed7aa', stroke: '#fb923c' }, // bottom-left
  { id: 'carb',      startDeg: 270, endDeg: 360, fill: '#fef9c3', stroke: '#fde047' }, // bottom-right
];

function PlateSVG({ placements, cardsById }: {
  placements: Array<{ foodId: string; quadrant: string }>;
  cardsById: Record<string, { id: string; label: { en: string; bm: string }; costRM: number }>;
}) {
  const bySection: Record<string, string[]> = { veg_fruit: [], protein: [], carb: [] };
  for (const p of placements) bySection[p.quadrant]?.push(p.foodId);

  return (
    <svg viewBox={`0 0 ${PLATE_SIZE} ${PLATE_SIZE}`} className="h-full w-full" aria-label="Plate diagram">
      {/* shadow */}
      <circle cx={CX} cy={CY} r={R + 2} fill="#e2e8f0" />
      {/* rim */}
      <circle cx={CX} cy={CY} r={R} fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
      {/* sectors */}
      {PLATE_SECTIONS.map((sec) => (
        <path key={sec.id} d={sectorPath(sec.startDeg, sec.endDeg)}
          fill={sec.fill} stroke={sec.stroke} strokeWidth="1.5" />
      ))}
      {/* dividing lines */}
      <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="white" strokeWidth="2.5" />
      <line x1={CX} y1={CY} x2={CX} y2={CY + R} stroke="white" strokeWidth="2.5" />
      {/* emoji labels for placed items — stacked with tiny offset */}
      {PLATE_SECTIONS.map((sec) => {
        const items = bySection[sec.id] ?? [];
        if (items.length === 0) return null;
        const ctr = sectorCentroid(sec.startDeg, sec.endDeg, R * 0.55);
        const text = items.map((id) => FOOD_EMOJI[id] ?? '🍽').join('');
        return (
          <text key={sec.id} x={ctr.x} y={ctr.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="18" className="select-none">
            {text}
          </text>
        );
      })}
      {/* outer rim border */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#94a3b8" strokeWidth="2" />
    </svg>
  );
}
// ---------------------------------------------------------------------------

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

  const totalCost     = placements.reduce((s, p) => s + cardsById[p.foodId].costRM, 0);
  const totalCalories = placements.reduce((s, p) => s + cardsById[p.foodId].calories, 0);
  const overBudget    = totalCost > question.budgetLimitRM;

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

      {/* Budget bar */}
      <div className={`mb-3 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium ${overBudget ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
        <span>RM{totalCost.toFixed(2)} / RM{question.budgetLimitRM.toFixed(2)} {placements.length > 0 && `(${overBudget ? t('input.overBudget') : t('input.withinBudget')})`}</span>
        <span>{totalCalories} kcal</span>
      </div>

      {/* Layout: food cards left, plate right */}
      <div className="flex gap-3">
        {/* Food card tray */}
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Food tray</p>
          <div className="flex flex-wrap gap-1.5">
            {shuffledCards.filter((c) => !placedIds.has(c.id)).map((card) => (
              <button
                key={card.id}
                type="button"
                disabled={disabled}
                onClick={() => setActiveFood((cur) => (cur === card.id ? null : card.id))}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
                  activeFood === card.id
                    ? 'border-[#0B2545] bg-[#0B2545] text-white shadow'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{FOOD_EMOJI[card.id] ?? '🍽'}</span>
                <span>{tx(card.label)}</span>
                <span className="text-[10px] opacity-70">RM{card.costRM.toFixed(2)}</span>
              </button>
            ))}
          </div>
          {/* Placed items list (tap to remove) */}
          {placements.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {placements.map((p) => (
                <button
                  key={p.foodId}
                  type="button"
                  disabled={disabled}
                  onClick={() => removePlacement(p.foodId)}
                  title="Remove"
                  className="flex items-center gap-1 rounded-full bg-[#E4002B]/10 px-2 py-0.5 text-[11px] font-medium text-[#E4002B]"
                >
                  {FOOD_EMOJI[p.foodId]} {tx(cardsById[p.foodId].label)} ✕
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plate SVG with tap-to-place quadrant buttons */}
        <div className="flex-shrink-0">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {activeFood ? '👉 Tap a section' : 'Your plate'}
          </p>
          <div className="relative h-52 w-52">
            <PlateSVG placements={placements} cardsById={cardsById} />
            {/* Invisible clickable overlays for each quadrant */}
            {PLATE_SECTIONS.map((sec) => {
              const label = question.quadrants.find((q) => q.id === sec.id);
              return (
                <button
                  key={sec.id}
                  type="button"
                  disabled={disabled || !activeFood}
                  onClick={() => place(sec.id)}
                  title={label ? tx(label.label) : sec.id}
                  className="absolute inset-0 cursor-pointer bg-transparent transition-opacity disabled:cursor-default"
                  style={{ opacity: activeFood ? 0.01 : 0 }}
                  aria-label={`Place in ${label ? tx(label.label) : sec.id}`}
                />
              );
            })}
          </div>
          {/* Quadrant legend */}
          <div className="mt-1 space-y-0.5 text-[10px]">
            {question.quadrants.map((q) => {
              const sec = PLATE_SECTIONS.find((s) => s.id === q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={disabled || !activeFood}
                  onClick={() => place(q.id)}
                  className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left font-medium transition ${
                    activeFood && !disabled
                      ? 'cursor-pointer hover:ring-2 hover:ring-[#0B2545]'
                      : 'cursor-default'
                  }`}
                  style={{ backgroundColor: sec?.fill ?? '#f8fafc', borderColor: sec?.stroke, borderWidth: 1, borderStyle: 'solid' }}
                >
                  <span>{tx(q.label)}</span>
                  <span className="ml-auto opacity-60">{Math.round(q.fraction * 100)}%</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SubmitButton
        disabled={placements.length === 0 || disabled}
        onClick={() => onAnswer({ placements, totalCostRM: totalCost, totalCalories })}
      />
    </div>
  );
}
