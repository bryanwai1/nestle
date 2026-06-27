// components/game/inputs/DragSequenceInput.tsx
//
// "Drag each step into a numbered box" ordering interaction. Uses Pointer
// Events (not native HTML5 drag-and-drop) so it behaves the same on phones,
// tablets and desktop — a floating card follows the finger/cursor and drops
// into a slot. Steps start in a tray; the team drags them into boxes 1..N.
//
// Photos on each step (step.imageUrl) and the optional context image
// (question.imageUrl) are purely decorative. The order submitted is the slot
// order, compared to correctOrder by the existing grader — grading is unchanged
// (still onAnswer({ order })).

'use client';

import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { stableShuffle } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { DragSequenceQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

type Step = { id: string; label: { en: string; bm: string }; imageUrl?: string };
type Origin = { type: 'pool' } | { type: 'slot'; index: number };
type Drag = { id: string; origin: Origin; x: number; y: number };

export function DragSequenceInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'drag_sequence'> & { question: DragSequenceQuestion }) {
  const { t, tx } = useLanguage();

  const stepsById = Object.fromEntries(
    question.steps.map((s) => [s.id, s as Step])
  ) as Record<string, Step>;
  const N = question.steps.length;

  const [pool, setPool] = useState<string[]>(() =>
    stableShuffle(question.steps, teamId, question.id).map((s) => s.id)
  );
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(N).fill(null));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const contextImage = (question as DragSequenceQuestion & { imageUrl?: string }).imageUrl;
  const placed = slots.filter((s) => s !== null).length;
  const allPlaced = placed === N;

  function detectSlot(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y);
    const slotEl = el?.closest('[data-slot]') as HTMLElement | null;
    return slotEl ? Number(slotEl.dataset.slot) : null;
  }

  function beginDrag(e: ReactPointerEvent, id: string, origin: Origin) {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ id, origin, x: e.clientX, y: e.clientY });
    setHover(detectSlot(e.clientX, e.clientY));
  }

  function onMove(e: ReactPointerEvent) {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
    setHover(detectSlot(e.clientX, e.clientY));
  }

  function cancelDrag() {
    setDrag(null);
    setHover(null);
  }

  function endDrag(e: ReactPointerEvent) {
    if (!drag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slotEl = el?.closest('[data-slot]') as HTMLElement | null;
    const poolEl = el?.closest('[data-pool]') as HTMLElement | null;
    const target: Origin | null = slotEl
      ? { type: 'slot', index: Number(slotEl.dataset.slot) }
      : poolEl
      ? { type: 'pool' }
      : null;
    if (target) place(drag.id, drag.origin, target);
    cancelDrag();
  }

  function place(id: string, origin: Origin, target: Origin) {
    let nextPool = [...pool];
    const nextSlots = [...slots];

    // remove the dragged step from wherever it came from
    if (origin.type === 'pool') nextPool = nextPool.filter((p) => p !== id);
    else nextSlots[origin.index] = null;

    if (target.type === 'pool') {
      if (!nextPool.includes(id)) nextPool.push(id);
    } else {
      const occupant = nextSlots[target.index];
      nextSlots[target.index] = id;
      if (occupant && occupant !== id) {
        // bump the previous occupant back to the dragged step's old spot,
        // or to the tray if the step came from the tray
        if (origin.type === 'slot') nextSlots[origin.index] = occupant;
        else if (!nextPool.includes(occupant)) nextPool.push(occupant);
      }
    }
    setPool(nextPool);
    setSlots(nextSlots);
  }

  function clearSlot(index: number) {
    if (disabled) return;
    const id = slots[index];
    if (!id) return;
    const nextSlots = [...slots];
    nextSlots[index] = null;
    setSlots(nextSlots);
    setPool((p) => (p.includes(id) ? p : [...p, id]));
  }

  const dragStep = drag ? stepsById[drag.id] : null;

  return (
    <div>
      {contextImage && (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={contextImage} alt="" className="max-h-60 w-full object-cover" />
        </div>
      )}

      <HelperText>{t('input.arrangeSteps')}</HelperText>

      {/* Numbered boxes */}
      <div className="space-y-2">
        {slots.map((id, i) => {
          const step = id ? stepsById[id] : null;
          const isHover = hover === i;
          return (
            <div
              key={i}
              data-slot={i}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition ${
                step
                  ? 'border-solid border-slate-200 bg-white shadow-sm'
                  : isHover
                  ? 'border-dashed border-[#E4002B] bg-[#E4002B]/5'
                  : 'border-dashed border-slate-300 bg-slate-50'
              }`}
            >
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${
                  step ? 'bg-[#0B2545]' : 'bg-slate-300'
                }`}
              >
                {i + 1}
              </span>
              {step ? (
                <div
                  onPointerDown={(e) => beginDrag(e, step.id, { type: 'slot', index: i })}
                  onPointerMove={onMove}
                  onPointerUp={endDrag}
                  onPointerCancel={cancelDrag}
                  style={{ touchAction: 'none' }}
                  className={`flex flex-1 cursor-grab touch-none select-none items-center gap-3 ${
                    drag?.id === step.id ? 'opacity-30' : ''
                  }`}
                >
                  {step.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={step.imageUrl}
                      alt=""
                      className="h-12 w-16 flex-none rounded-lg border border-slate-100 object-cover"
                    />
                  )}
                  <span className="flex-1 text-sm text-slate-700">{tx(step.label)}</span>
                  <button
                    type="button"
                    onClick={() => clearSlot(i)}
                    aria-label="Remove"
                    className="flex-none rounded-md px-2 text-slate-400 transition hover:text-[#E4002B]"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="flex-1 text-sm italic text-slate-400">
                  {tx({ en: 'Drop a step here', bm: 'Lepaskan langkah di sini' })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tray of steps still to place */}
      <div data-pool className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {tx({ en: 'Steps to place', bm: 'Langkah untuk disusun' })}
        </p>
        {pool.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">
            {tx({
              en: 'All steps placed — drag any box to rearrange.',
              bm: 'Semua langkah disusun — seret kotak untuk susun semula.',
            })}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pool.map((id) => {
              const step = stepsById[id];
              return (
                <div
                  key={id}
                  onPointerDown={(e) => beginDrag(e, id, { type: 'pool' })}
                  onPointerMove={onMove}
                  onPointerUp={endDrag}
                  onPointerCancel={cancelDrag}
                  style={{ touchAction: 'none' }}
                  className={`flex cursor-grab touch-none select-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm ${
                    drag?.id === id ? 'opacity-30' : ''
                  }`}
                >
                  {step.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={step.imageUrl}
                      alt=""
                      className="h-10 w-14 flex-none rounded-md border border-slate-100 object-cover"
                    />
                  )}
                  <span className="text-sm text-slate-700">{tx(step.label)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating card that follows the pointer while dragging */}
      {drag && dragStep && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-xl border border-[#E4002B] bg-white px-3 py-2 shadow-xl"
          style={{ left: drag.x - 70, top: drag.y - 24, maxWidth: 240 }}
        >
          {dragStep.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dragStep.imageUrl} alt="" className="h-10 w-14 flex-none rounded-md object-cover" />
          )}
          <span className="text-sm font-medium text-slate-800">{tx(dragStep.label)}</span>
        </div>
      )}

      <SubmitButton
        disabled={disabled || !allPlaced}
        onClick={() => allPlaced && onAnswer({ order: slots as string[] })}
      />
    </div>
  );
}
