// @ts-nocheck
// components/game/inputs/BudgetCanvasInput.tsx
//
// "Suku-Suku Separuh" healthy-plate builder. The plate shows the ½ / ¼ / ¼
// cut lines; players drag whole foods from the 3-column tray onto the plate.
// DROP LOGIC: a food only sticks in the section that matches its category —
// drag chicken onto Carbs and it snaps back. This fixes the old "everything
// lands in carbs" bug. Food cards use an imageUrl when present (real photos
// drop in later) and fall back to an emoji for now.

'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { BudgetCanvasQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { usePointerDrag } from './dragdrop';
import { SubmitButton } from './shared';

const EMOJI: Record<string, string> = {
  f1: '🥦', f2: '🍌', f3: '🍎', f4: '🍉',
  f5: '🍗', f6: '🥚', f7: '🐟', f8: '🧊',
  f9: '🍚', f10: '🍞', f11: '🍠',
};

// tray column order
const COLUMN_ORDER = ['protein', 'veg_fruit', 'carb'];

export function BudgetCanvasInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'budget_canvas'> & { question: BudgetCanvasQuestion }) {
  const { tx } = useLanguage();
  const [placed, setPlaced] = useState<Record<string, string>>({}); // foodId -> quadrantId

  const foodById = useMemo(
    () => Object.fromEntries(question.foodCards.map((f) => [f.id, f])),
    [question.foodCards]
  );

  const { startDrag, draggingItem, hoverZone } = usePointerDrag((foodId, zoneId) => {
    const food = foodById[foodId];
    if (!food) return;
    setPlaced((p) => {
      const next = { ...p };
      if (zoneId === '__tray') {
        delete next[foodId];
      } else if (food.category === zoneId) {
        next[foodId] = zoneId; // only sticks in the correct section
      }
      // wrong section -> ignored, chip snaps back
      return next;
    });
  });

  const totalCost = useMemo(
    () => Object.keys(placed).reduce((s, id) => s + (foodById[id]?.costRM ?? 0), 0),
    [placed, foodById]
  );
  const overBudget = totalCost > question.budgetLimitRM;

  const quadrant = (id: string) => question.quadrants.find((q) => q.id === id);
  const placedIn = (qid: string) => Object.entries(placed).filter(([, q]) => q === qid).map(([fid]) => foodById[fid]);
  const tray = question.foodCards.filter((f) => !placed[f.id]);
  const allSectionsFilled = question.quadrants.every((q) => placedIn(q.id).length > 0);

  const FoodChip = ({ id, mini = false }: { id: string; mini?: boolean }) => {
    const food = foodById[id];
    const img = (food as { imageUrl?: string }).imageUrl;
    return (
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => !disabled && startDrag(id, e)}
        style={{ touchAction: 'none' }}
        className={`flex select-none items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 text-left transition ${
          draggingItem === id ? 'border-[#0B2545] opacity-40' : 'border-slate-300'
        }`}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className={mini ? 'h-6 w-6 object-contain' : 'h-8 w-8 object-contain'} />
        ) : (
          <span className={mini ? 'text-base' : 'text-xl'}>{EMOJI[id] ?? '🍽️'}</span>
        )}
        <span className={`font-medium leading-tight text-slate-700 ${mini ? 'text-[10px]' : 'text-xs'}`}>{tx(food.label)}</span>
        {!mini && <span className="ml-auto text-[10px] font-semibold text-slate-400">RM{food.costRM}</span>}
      </button>
    );
  };

  const Section = ({ qid, className }: { qid: string; className: string }) => {
    const q = quadrant(qid);
    if (!q) return null;
    return (
      <div
        data-dnd-zone={qid}
        className={`${className} flex flex-col gap-1.5 p-2 transition ${
          hoverZone === qid ? 'bg-[#0B2545]/10' : ''
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx(q.label)}</p>
        <div className="flex flex-wrap gap-1.5">
          {placedIn(qid).map((f) => <FoodChip key={f.id} id={f.id} mini />)}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* The plate: left half = veg + fruit, right split into two quarters */}
      <div className="mx-auto mb-4 grid aspect-[3/2] w-full max-w-md grid-cols-2 overflow-hidden rounded-2xl border-4 border-slate-300 bg-white shadow-inner">
        <Section qid="veg_fruit" className="col-span-1 row-span-2 border-r-2 border-dashed border-slate-300" />
        <div className="col-span-1 grid grid-rows-2">
          <Section qid="protein" className="border-b-2 border-dashed border-slate-300" />
          <Section qid="carb" className="" />
        </div>
      </div>

      {/* Budget meter */}
      <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-2 text-sm font-semibold ${
        overBudget ? 'border-red-300 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}>
        <span>Spent</span>
        <span className="tabular-nums">RM{totalCost.toFixed(2)} / RM{question.budgetLimitRM}</span>
      </div>

      {/* Food tray in 3 columns */}
      <div
        data-dnd-zone="__tray"
        className={`grid grid-cols-3 gap-2 rounded-xl border-2 border-dashed p-2 transition ${
          hoverZone === '__tray' ? 'border-[#0B2545] bg-[#0B2545]/5' : 'border-slate-200'
        }`}
      >
        {COLUMN_ORDER.map((catId) => (
          <div key={catId} className="flex flex-col gap-1.5">
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {tx(quadrant(catId)?.label ?? { en: '', bm: '' } as never)}
            </p>
            {tray.filter((f) => f.category === catId).map((f) => <FoodChip key={f.id} id={f.id} />)}
          </div>
        ))}
      </div>

      <SubmitButton
        disabled={!allSectionsFilled || disabled}
        onClick={() =>
          onAnswer({ placements: Object.entries(placed).map(([foodId, quadrant]) => ({ foodId, quadrant })) })
        }
      />
    </div>
  );
}
