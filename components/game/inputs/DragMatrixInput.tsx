// components/game/inputs/DragMatrixInput.tsx
//
// Same touch-reliability reasoning as DragSequenceInput: "click left, then
// click its match on the right" gives the mix-and-match interaction without
// depending on pointer drag events. Paired rows share a colour + number.

'use client';

import { useMemo, useState } from 'react';
import { stableShuffleWithIndex } from '@/lib/game/shuffle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { DragMatrixQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

const PAIR_COLORS = ['#E4002B', '#0B2545', '#1E8F4E', '#C77700', '#7C3AED', '#0E7490'];

export function DragMatrixInput({
  question,
  teamId,
  disabled,
  onAnswer,
}: QuestionInputProps<'drag_matrix'> & { question: DragMatrixQuestion }) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const { tx } = useLanguage();

  // Right column gets shuffled; each chip's identity stays its true pair id
  // even though it's displayed in a randomized position.
  const shuffledRight = useMemo(
    () => stableShuffleWithIndex(question.pairs, teamId, question.id + ':right').map(({ item }) => item),
    [question.pairs, question.id, teamId]
  );

  const matchedRightIds = new Set(Object.values(matches));
  const colorFor = (pairId: string) => {
    const order = question.pairs.findIndex((p) => p.id === pairId);
    return PAIR_COLORS[order % PAIR_COLORS.length];
  };

  function pickLeft(leftId: string) {
    if (disabled) return;
    setActiveLeft((cur) => (cur === leftId ? null : leftId));
  }

  function pickRight(rightId: string) {
    if (disabled || !activeLeft) return;
    setMatches((m) => {
      const next = { ...m };
      // unlink anything else that was already pointing at this right id
      for (const k of Object.keys(next)) if (next[k] === rightId) delete next[k];
      next[activeLeft] = rightId;
      return next;
    });
    setActiveLeft(null);
  }

  const allMatched = question.pairs.every((p) => matches[p.id]);

  return (
    <div>
      <HelperText>
        Tap an item in <strong>{tx(question.leftColumnLabel)}</strong>, then tap its match in{' '}
        <strong>{tx(question.rightColumnLabel)}</strong>.
      </HelperText>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{tx(question.leftColumnLabel)}</p>
          {question.pairs.map((p) => {
            const isMatched = Boolean(matches[p.id]);
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => pickLeft(p.id)}
                style={isMatched ? { borderColor: colorFor(p.id) } : undefined}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs leading-snug transition ${
                  activeLeft === p.id
                    ? 'border-[#0B2545] bg-[#0B2545]/5 font-medium'
                    : isMatched
                    ? 'bg-white font-medium'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                {tx(p.left)}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{tx(question.rightColumnLabel)}</p>
          {shuffledRight.map((p) => {
            const isMatched = matchedRightIds.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => pickRight(p.id)}
                style={isMatched ? { borderColor: colorFor(p.id) } : undefined}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs leading-snug transition ${
                  isMatched ? 'bg-white font-medium' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {tx(p.right)}
              </button>
            );
          })}
        </div>
      </div>
      <SubmitButton disabled={!allMatched || disabled} onClick={() => onAnswer({ matches })} />
    </div>
  );
}
