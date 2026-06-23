// components/game/inputs/SubjectiveSelectInput.tsx
//
// Quiz mode: plain answer blanks only. No quick-pick chips, no "anything
// else" box, no helper hint — players type their own answers and the
// response is auto-graded against the answer key.

'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { SubjectiveSelectQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';

export function SubjectiveSelectInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'subjective_select'> & { question: SubjectiveSelectQuestion }) {
  const [answers, setAnswers] = useState<string[]>(Array(question.minCorrectRequired).fill(''));
  const { t } = useLanguage();

  function setAnswer(i: number, value: string) {
    setAnswers((a) => a.map((v, idx) => (idx === i ? value : v)));
  }

  const filledCount = answers.filter((a) => a.trim() !== '').length;

  return (
    <div>
      <div className="space-y-2">
        {answers.map((value, i) => (
          <input
            key={i}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => setAnswer(i, e.target.value)}
            placeholder={`${t('input.answerNumber')} ${i + 1}`}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
          />
        ))}
      </div>

      <SubmitButton
        disabled={filledCount < question.minCorrectRequired || disabled}
        onClick={() => onAnswer({ selected: answers.filter((a) => a.trim() !== '') })}
      />
    </div>
  );
}
