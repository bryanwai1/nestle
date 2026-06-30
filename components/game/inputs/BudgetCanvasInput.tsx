// @ts-nocheck
// components/game/inputs/BudgetCanvasInput.tsx
//
// "Suku-Suku Separuh" healthy-plate builder — ROUND plate, ½ veg/fruit,
// ¼ protein, ¼ carbs. Players may place ANY food in ANY wedge (free
// placement); correctness is judged at grading time, not blocked here.
//
// The plate itself IS the drop target — each wedge is a real SVG pie-slice
// <path> used both for the visible color AND the pointer-drop hit area, so
// food dropped visually inside a wedge always registers in that same wedge
// (previously a rectangular overlay grid didn't match the diagonal wedge
// edges, so drops near the center could register in the wrong wedge).
// Food placed in a wedge renders as small image icons inside that wedge.
// No text labels on the plate (½ / ¼ / ¼ proportions only — never which
// food category belongs where, since that's the answer being graded).

'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { BudgetCanvasQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { usePointerDrag } from './dragdrop';
import { SubmitButton } from './shared';

const COLUMN_ORDER = ['protein', 'veg_fruit', 'carb'];

const WEDGE_FILL: Record<string, string> = {
  veg_fruit: '#C0DD97',
  protein: '#F0997B',
  carb: '#FAC775',
};

const WEDGE_PATH: Record<string, string> = {
  veg_fruit: 'M100,100 L100,2 A98,98 0 0,0 100,198 Z',
  protein: 'M100,100 L100,2 A98,98 0 0,1 198,100 Z',
  carb: 'M100,100 L198,100 A98,98 0 0,1 100,198 Z',
};

const WEDGE_ICON_ORIGIN: Record<string, { x: number; y: number }> = {
  veg_fruit: { x: 27, y: 50 },
  protein: { x: 70, y: 30 },
  carb: { x: 70, y: 70 },
};

export function BudgetCanvasInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'budget_canvas'> & { question: BudgetCanvasQuestion }) {
  const { tx } = useLanguage();
  const [placed, setPlaced] = useState<Record<string, string>>({});

  const foodById = useMemo(
    () => Object.fromEntries(question.foodCards.map((f) => [f.id, f])),
    [question.foodCards]
  );

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

  const placedIn = (qid: string) =>
    Object.entries(placed).filter(([, q]) => q === qid).map(([fid]) => foodById[fid]);
  const tray = question.foodCards.filter((f) => !placed[f.id]);
  const allSectionsFilled = question.quadrants.every((q) => placedIn(q.id).length > 0);

  const FoodChip = ({ id }: { id: string }) => {
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
          <img src={img} alt="" className="h-9 w-9 object-contain" />
        ) : (
          <span className="text-xl">🍽️</span>
        )}
        <span className="text-xs font-medium leading-tight text-slate-700">{tx(food.label)}</span>
        <span className="ml-auto text-[10px] font-semibold text-slate-400">RM{food.costRM}</span>
      </button>
    );
  };

  const PlatedIcon = ({ id, x, y }: { id: string; x: number; y: number }) => {
    const food = foodById[id];
    const img = (food as { imageUrl?: string }).imageUrl;
    return (
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
        <div className="pointer-events-auto relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white/90 shadow">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-7 w-7 object-contain" />
          ) : (
            <span className="text-base">🍽️</span>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => removePlaced(id)}
            aria-label="Remove"
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold leading-none text-white shadow"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  function iconPositions(qid: string, count: number) {
    const origin = WEDGE_ICON_ORIGIN[qid];
    if (count <= 1) return [origin];
    const positions = [];
    const ringRadiusPct = 11;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions.push({
        x: origin.x + Math.cos(angle) * ringRadiusPct,
        y: origin.y + Math.sin(angle) * ringRadiusPct,
      });
    }
    return positions;
  }

  return (
    <div>
      <div className="mx-auto mb-4 w-full max-w-sm">
        <div className="relative mx-auto aspect-square w-full">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            {question.quadrants.map((q) => (
              <path
                key={q.id}
                data-dnd-zone={q.id}
                d={WEDGE_PATH[q.id]}
                fill={WEDGE_FILL[q.id] ?? '#e2e8f0'}
                stroke="#fff"
                strokeWidth="2.5"
                style={{
                  filter: hoverZone === q.id ? 'brightness(1.15)' : undefined,
                  transition: 'filter 0.15s',
                }}
              />
            ))}
            <circle cx="100" cy="100" r="98" fill="none" stroke="#cbd5e1" strokeWidth="4" />
          </svg>

          <div className="pointer-events-none absolute inset-0">
            {question.quadrants.map((q) => {
              const items = placedIn(q.id);
              const positions = iconPositions(q.id, items.length);
              return items.map((f, i) => (
                <PlatedIcon key={f.id} id={f.id} x={positions[i].x} y={positions[i].y} />
              ));
            })}
          </div>

          {hoverZone && WEDGE_FILL[hoverZone] && (
            <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
              drop here
            </span>
          )}
        </div>
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
        {COLUMN_ORDER.map((catId) => {
          const q = question.quadrants.find((qq) => qq.id === catId);
          return (
            <div key={catId} className="flex flex-col gap-1.5">
              <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {tx(q?.label ?? ({ en: '', bm: '' } as never))}
              </p>
              {tray.filter((f) => f.category === catId).map((f) => <FoodChip key={f.id} id={f.id} />)}
            </div>
          );
        })}
      </div>

      <SubmitButton
        disabled={!allSectionsFilled || disabled}
        onClick={() => onAnswer({ placements: Object.entries(placed).map(([foodId, quadrant]) => ({ foodId, quadrant })) })}
      />
    </div>
  );
}
