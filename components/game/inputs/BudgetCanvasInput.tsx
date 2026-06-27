// @ts-nocheck
// components/game/inputs/BudgetCanvasInput.tsx
//
// "Suku-Suku Separuh" healthy-plate builder — ROUND plate, ½ veg/fruit,
// ¼ protein, ¼ carbs. Players may place ANY food in ANY section (free
// placement); correctness is judged at grading time, not blocked here.
//
// Layout: the round plate is a clean DROP TARGET (each wedge shows a count and
// highlights on hover). The food you place shows in tidy section cards BELOW
// the plate, so chips wrap normally and never overflow the circle. Cost
// tracking, the tray, grading and onAnswer are unchanged.

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
  veg_fruit: 'border-[#9ec06a] bg-[#C0DD97]/40',
  protein: 'border-[#e07d59] bg-[#F0997B]/35',
  carb: 'border-[#e0a945] bg-[#FAC775]/40',
};

const SECTION_SWATCH: Record<string, string> = {
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

  function removePlaced(foodId: string) {
    setPlaced((p) => {
      const next = { ...p };
      delete next[foodId];
      return next;
    });
  }

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

  // A placed chip = draggable FoodChip (drag between sections / back to tray)
  // plus a ✕ to remove. Lives in the section cards below the plate.
  const PlacedChip = ({ id }: { id: string }) => (
    <div className="relative">
      <FoodChip id={id} mini />
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => removePlaced(id)}
        aria-label="Remove"
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold leading-none text-white shadow"
      >
        ✕
      </button>
    </div>
  );

  // Plate wedge = drop zone only: shows a count + hover highlight, no chips
  // inside the circle (that was the overflow bug).
  const PlateZone = ({ qid, className }: { qid: string; className: string }) => {
    const q = quadrant(qid);
    if (!q) return null;
    const isHover = hoverZone === qid;
    const count = placedIn(qid).length;
    return (
      <div
        data-dnd-zone={qid}
        className={`${className} relative flex items-center justify-center overflow-hidden transition ${
          isHover ? 'ring-4 ring-inset ring-emerald-400' : ''
        }`}
      >
        {count > 0 && (
          <span className="rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-bold text-[#0B2545] shadow">
            {count}
          </span>
        )}
        {isHover && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
            drop here
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* SVG plate: real ½ / ¼ / ¼ wedges. Invisible square drop-zones overlay
          each wedge so dragging onto the plate still works. */}
      <div className="mx-auto mb-4 w-full max-w-sm">
        <div className="relative mx-auto aspect-square w-full">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            {/* veg/fruit = left half */}
            <path d="M100,100 L100,2 A98,98 0 0,0 100,198 Z" fill="#C0DD97" />
            {/* protein = top-right quarter */}
            <path d="M100,100 L100,2 A98,98 0 0,1 198,100 Z" fill="#F0997B" />
            {/* carb = bottom-right quarter */}
            <path d="M100,100 L198,100 A98,98 0 0,1 100,198 Z" fill="#FAC775" />
            {/* white cut lines */}
            <line x1="100" y1="2" x2="100" y2="198" stroke="#fff" strokeWidth="2.5" />
            <line x1="100" y1="100" x2="198" y2="100" stroke="#fff" strokeWidth="2.5" />
            {/* rim */}
            <circle cx="100" cy="100" r="98" fill="none" stroke="#cbd5e1" strokeWidth="4" />
          </svg>

          {/* Drop zones over each wedge (count + hover only) */}
          <div className="absolute inset-0 grid grid-cols-2">
            <PlateZone qid="veg_fruit" className="col-span-1 row-span-2" />
            <div className="col-span-1 grid grid-rows-2">
              <PlateZone qid="protein" className="" />
              <PlateZone qid="carb" className="" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          ½ vegetables &amp; fruit · ¼ protein · ¼ carbs
        </p>
      </div>

      {/* Spent */}
      <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-2 text-sm font-semibold ${
        overBudget ? 'border-red-300 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}>
        <span>Spent</span>
        <span className="tabular-nums">RM{totalCost.toFixed(2)} / RM{question.budgetLimitRM}</span>
      </div>

      {/* Your plate — placed items per section (wrap cleanly, also drop targets) */}
      <div className="mb-4 space-y-2">
        {question.quadrants.map((q) => {
          const items = placedIn(q.id);
          const isHover = hoverZone === q.id;
          return (
            <div
              key={q.id}
              data-dnd-zone={q.id}
              className={`rounded-xl border-2 p-2.5 transition ${SECTION_TINT[q.id] ?? 'border-slate-200'} ${
                isHover ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                <span className={`h-2.5 w-2.5 rounded-full ${SECTION_SWATCH[q.id] ?? ''}`} />
                {tx(q.label)}
                <span className="ml-1 rounded-full bg-white/70 px-1.5 text-[10px] text-slate-500">{items.length}</span>
              </p>
              {items.length === 0 ? (
                <p className="px-1 py-1 text-xs italic text-slate-500">
                  {tx({ en: 'Drag food here', bm: 'Seret makanan ke sini' })}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((f) => <PlacedChip key={f.id} id={f.id} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tray of unplaced foods */}
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
