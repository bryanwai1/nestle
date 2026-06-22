// components/game/inputs/MathInputInput.tsx

'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { MathInputQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function MathInputInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'math_input'> & { question: MathInputQuestion }) {
  const [value, setValue] = useState('');
  const { t, tx } = useLanguage();
  const formulaText = tx(question.formulaDisplay).trim();

  return (
    <div>
      {/* Only show the formula hint when it's non-empty — Q27 intentionally
          has an empty formulaDisplay so players must recall it themselves */}
      {formulaText && (
        <HelperText>
          {t('input.formula')}: <span className="font-mono font-semibold text-slate-700">{formulaText}</span>
        </HelperText>
      )}
      <input
        type="number"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('input.enterYourAnswer')}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold focus:border-[#0B2545] focus:outline-none"
      />
      <SubmitButton
        disabled={value.trim() === '' || disabled}
        onClick={() => onAnswer({ value: Number(value) })}
      />
    </div>
  );
}
