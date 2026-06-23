// @ts-nocheck
// components/game/inputs/BudgetCanvasInput.tsx
//
// "Suku-Suku Separuh" healthy-plate builder — ROUND plate, ½ veg/fruit,
// ¼ protein, ¼ carbs. Players may place ANY food in ANY section (free
// placement); correctness is judged at grading time, not blocked here.
// Cost/calorie tracking and the admin summary are unchanged.

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

const COLUMN_ORDER = ['protein', 'veg_fruit', 'carb'];

const SECTION_TINT: Record<string, string> = {
  veg_fruit: 'bg-[#C0DD97]',
  protein: 'bg-[#F0997B]',
  carb: 'bg-[#FAC775]',
};

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

  // Free placement: any food can go in any section. Wrong placement is judged
  // at grading, not blocked here.
  const { startDrag, draggingItem, hoverZone } = usePointerDrag((foodId, zoneId) => {
    if (!foodById[foodId]) return;
    setPlaced((p) => {
      const next = { ...p };
      if (zoneId === '__tray') delete next[foodId];
      else next[foodId] = zoneId;
      return next;
    });
  });

  const totalCost = useMemo(
    () => Object.keys(placed).reduce((s, id) => s + (foodById[id]?.costRM ?? 0), 0),
    [placed, foodById]
  );
  const overBudget = totalCost > question.budgetLimitRM;

  const quadrant = (id: string) => question.quadrants.find((q) => q.id === id);
  const placedIn = (qid: string) =>
    Object.entries(placed).filter(([, q]) => q === qid).map(([fid]) => foodById[fid]);
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
          <img src={img} alt="" className={mini ? 'h-7 w-7 object-contain' : 'h-9 w-9 object-contain'} />
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
    const isHover = hoverZone === qid;
    return (
      <div
        data-dnd-zone={qid}
        className={`${className} relative flex h-full flex-col gap-1.5 overflow-hidden p-2.5 transition ${SECTION_TINT[qid] ?? ''} ${
          isHover ? 'ring-4 ring-inset ring-emerald-400' : ''
        }`}
      >
<p className="text-[10px] font-bold uppercase tracking-wide text-slate-700/80">{tx(q.label)}</p>        {isHover && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
            drop here
          </span>
        )}
        <div className="flex flex-wrap gap-1.5">
          {placedIn(qid).map((f) => <FoodChip key={f.id} id={f.id} mini />)}
        </div>
      </div>
    );
  };

  return (
    <div>
{/* Round plate: ½ / ¼ / ¼ cuts clipped to a circle */}
      <div className="mx-auto mb-4 w-full max-w-sm">
        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border-[10px] border-slate-300 bg-white shadow-inner">
          <div className="grid h-full w-full grid-cols-2">
            <Section qid="veg_fruit" className="col-span-1 row-span-2 border-r-2 border-white" />
            <div className="col-span-1 grid h-full grid-rows-2">
              <Section qid="protein" className="border-b-2 border-white" />
              <Section qid="carb" className="" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          ½ vegetables &amp; fruit · ¼ protein · ¼ carbs
        </p>
      </div>
      <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-2 text-sm font-semibold ${
        overBudget ? 'border-red-300 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}>
        <span>Spent</span>
        <span className="tabular-nums">RM{totalCost.toFixed(2)} / RM{question.budgetLimitRM}</span>
      </div>

      <div
        data-dnd-zone="__tray"
        className={`grid grid-cols-3 gap-2 rounded-xl border-2 border-dashed p-2 transition ${
          hoverZone === '__tray' ? 'border-[#0B2545] bg-[#0B2545]/5' : 'border-slate-200'
        }`}
      >
        {COLUMN_ORDER.map((catId) => (
          <div key={catId} className="flex flex-col gap-1.5">
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {tx(quadrant(catId)?.label ?? ({ en: '', bm: '' } as never))}
            </p>
            {tray.filter((f) => f.category === catId).map((f) => <FoodChip key={f.id} id={f.id} />)}
          </div>
        ))}
      </div>

      <SubmitButton
        disabled={!allSectionsFilled || disabled}
        onClick={() => onAnswer({ placements: Object.entries(placed).map(([foodId, quadrant]) => ({ foodId, quadrant })) })}
      />
    </div>
  );
}