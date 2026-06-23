// @ts-nocheck
// components/game/inputs/dragdrop.tsx
//
// Pointer-based drag and drop that works on phones AND laptops (HTML5 native
// DnD doesn't fire on touch, so we use Pointer Events + elementFromPoint).
// A floating clone of the grabbed chip follows the finger/cursor; on release
// we find the dropzone under the point and report (itemId, zoneId).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

import { SubmitButton } from './shared';

export function usePointerDrag(onDrop: (itemId: string, zoneId: string) => void) {
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const itemRef = useRef<string | null>(null);
  const moveRef = useRef<(e: PointerEvent) => void>();
  const upRef = useRef<(e: PointerEvent) => void>();

  const teardown = useCallback(() => {
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    if (moveRef.current) window.removeEventListener('pointermove', moveRef.current);
    if (upRef.current) window.removeEventListener('pointerup', upRef.current);
    itemRef.current = null;
    setDraggingItem(null);
    setHoverZone(null);
  }, []);

  useEffect(() => teardown, [teardown]);

  const startDrag = useCallback(
    (itemId: string, e: React.PointerEvent) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const clone = target.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: 'fixed',
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        width: `${rect.width}px`,
        transform: 'translate(-50%, -50%) scale(1.05)',
        pointerEvents: 'none',
        zIndex: '9999',
        opacity: '0.92',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
      });
      document.body.appendChild(clone);
      cloneRef.current = clone;
      itemRef.current = itemId;
      setDraggingItem(itemId);

      const onMove = (ev: PointerEvent) => {
        if (cloneRef.current) {
          cloneRef.current.style.left = `${ev.clientX}px`;
          cloneRef.current.style.top = `${ev.clientY}px`;
        }
        const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        const zone = el?.closest('[data-dnd-zone]') as HTMLElement | null;
        setHoverZone(zone?.getAttribute('data-dnd-zone') ?? null);
      };
      const onUp = (ev: PointerEvent) => {
        const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        const zone = el?.closest('[data-dnd-zone]') as HTMLElement | null;
        const zoneId = zone?.getAttribute('data-dnd-zone') ?? null;
        const id = itemRef.current;
        teardown();
        if (id && zoneId) onDrop(id, zoneId);
      };
      moveRef.current = onMove;
      upRef.current = onUp;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [onDrop, teardown]
  );

  return { startDrag, draggingItem, hoverZone };
}

// ---------------------------------------------------------------------------
// BoxSort — shared UI for "drag each item into the right box" questions
// (classification_matrix + categorized_dropzone). Items can be dragged between
// boxes or back to the tray. Submit unlocks once every item is placed.
// ---------------------------------------------------------------------------

type Cat = { id: string; label: any };
type Item = { id: string; label: any };

export function BoxSort({
  categories,
  items,
  disabled,
  onAnswer,
}: {
  categories: Cat[];
  items: Item[];
  disabled: boolean;
  onAnswer: (data: { placements: Record<string, string> }) => void;
}) {
  const { tx } = useLanguage();
  const [placements, setPlacements] = useState<Record<string, string>>({});

  const { startDrag, draggingItem, hoverZone } = usePointerDrag((itemId, zoneId) => {
    setPlacements((p) => {
      const next = { ...p };
      if (zoneId === '__tray') delete next[itemId];
      else next[itemId] = zoneId;
      return next;
    });
  });

  const tray = items.filter((it) => !placements[it.id]);
  const allPlaced = items.every((it) => placements[it.id]);

  const Chip = ({ it }: { it: Item }) => (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => !disabled && startDrag(it.id, e)}
      style={{ touchAction: 'none' }}
      className={`select-none rounded-xl border px-3 py-2 text-left text-xs font-medium leading-snug transition ${
        draggingItem === it.id ? 'border-[#0B2545] bg-[#0B2545]/5 opacity-40' : 'border-slate-300 bg-white text-slate-700'
      }`}
    >
      {it.imageUrl ? (
        <span className="flex items-center gap-2">
          <img src={it.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" />
          <span>{tx(it.label)}</span>
        </span>
      ) : (
        tx(it.label)
      )}
    </button>
  );

  return (
    <div>
      {/* tray of unplaced items */}
      <div
        data-dnd-zone="__tray"
        className={`mb-4 flex min-h-[56px] flex-wrap gap-2 rounded-xl border-2 border-dashed p-3 transition ${
          hoverZone === '__tray' ? 'border-[#0B2545] bg-[#0B2545]/5' : 'border-slate-200'
        }`}
      >
        {tray.length === 0 ? (
          <span className="self-center text-xs text-slate-400">All sorted — drag back here to change one.</span>
        ) : (
          tray.map((it) => <Chip key={it.id} it={it} />)
        )}
      </div>

      {/* category boxes */}
      <div className={`grid gap-3 ${categories.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {categories.map((cat) => {
          const inBox = items.filter((it) => placements[it.id] === cat.id);
          return (
            <div
              key={cat.id}
              data-dnd-zone={cat.id}
              className={`min-h-[120px] rounded-xl border-2 p-3 transition ${
                hoverZone === cat.id ? 'border-[#0B2545] bg-[#0B2545]/5' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="mb-2 text-sm font-semibold text-slate-800">{tx(cat.label)}</p>
              <div className="flex flex-col gap-2">
                {inBox.map((it) => <Chip key={it.id} it={it} />)}
              </div>
            </div>
          );
        })}
      </div>

      <SubmitButton disabled={!allPlaced || disabled} onClick={() => onAnswer({ placements })} />
    </div>
  );
}
