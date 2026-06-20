// components/game/inputs/SubjectiveSelectInput.tsx
//
// "Subjective" per the brief — admin always reviews these regardless of what
// autoGrade-style logic might suggest. The quick-pick chips just speed up
// typing on a phone keyboard; teams can still type anything in the blanks.

'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { SubjectiveSelectQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { HelperText, SubmitButton } from './shared';

export function SubjectiveSelectInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'subjective_select'> & { question: SubjectiveSelectQuestion }) {
  const [answers, setAnswers] = useState<string[]>(Array(question.minCorrectRequired).fill(''));
  const [freeText, setFreeText] = useState('');
  const { t, tx } = useLanguage();

  function setAnswer(i: number, value: string) {
    setAnswers((a) => a.map((v, idx) => (idx === i ? value : v)));
  }

  function fillNextEmpty(choiceText: string) {
    if (disabled) return;
    setAnswers((a) => {
      const emptyIdx = a.findIndex((v) => v.trim() === '');
      if (emptyIdx === -1) return a;
      const next = [...a];
      next[emptyIdx] = choiceText;
      return next;
    });
  }

  const filledCount = answers.filter((a) => a.trim() !== '').length;

  return (
    <div>
      <HelperText>
        {t('input.fillBlanks', { required: question.minCorrectRequired, filled: filledCount })}
      </HelperText>

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

      <p className="mb-2 mt-4 text-xs font-medium text-slate-400">{t('input.quickPicks')}</p>
      <div className="flex flex-wrap gap-2">
        {question.acceptableAnswers.map((choice) => {
          const label = tx(choice.text);
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled || answers.includes(label)}
              onClick={() => fillNextEmpty(label)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 disabled:opacity-30"
            >
              {label}
            </button>
          );
        })}
      </div>

      {question.freeText && (
        <textarea
          value={freeText}
          disabled={disabled}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder={t('input.anythingElse')}
          rows={2}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
        />
      )}

      <SubmitButton
        disabled={filledCount < question.minCorrectRequired || disabled}
        onClick={() => onAnswer({ selected: answers.filter((a) => a.trim() !== ''), freeText: freeText.trim() || undefined })}
      />
    </div>
  );
}
