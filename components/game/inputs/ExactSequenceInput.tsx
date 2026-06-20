// components/game/inputs/ExactSequenceInput.tsx
//
// 100% string-exact grading happens server-side (grade_response() in
// migration 0002) — this component just collects N ordered text values.

'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { ExactSequenceQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function ExactSequenceInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'exact_sequence'> & { question: ExactSequenceQuestion }) {
  const [values, setValues] = useState<string[]>(Array(question.blanks).fill(''));
  const { t } = useLanguage();

  function setValue(i: number, v: string) {
    setValues((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }

  const allFilled = values.every((v) => v.trim() !== '');

  return (
    <div>
      <HelperText>{t('input.spellExactly')}</HelperText>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {values.map((v, i) => (
          <div key={i}>
            <p className="mb-1 text-center text-xs font-semibold text-slate-400">{t('input.step')} {i + 1}</p>
            <input
              type="text"
              value={v}
              disabled={disabled}
              onChange={(e) => setValue(i, e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-medium focus:border-[#0B2545] focus:outline-none"
            />
          </div>
        ))}
      </div>
      <SubmitButton disabled={!allFilled || disabled} onClick={() => onAnswer({ values: values.map((v) => v.trim()) })} />
    </div>
  );
}
