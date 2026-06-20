// components/game/ModuleTimerBar.tsx

'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

export function ModuleTimerBar({
  moduleTitle,
  questionIndex,
  totalQuestions,
  timerDisplay,
  isLow,
  onFirstRender,
}: {
  moduleTitle: string;
  questionIndex: number;
  totalQuestions: number;
  timerDisplay: string;
  isLow: boolean;
  onFirstRender: () => void;
}) {
  const fired = useRef(false);
  const { t } = useLanguage();
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      onFirstRender();
    }
  }, [onFirstRender]);

  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-[#0B2545] px-5 py-3 text-white">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">{moduleTitle}</p>
          <p className="text-sm font-medium">
            {t('runner.questionOf', { current: questionIndex + 1, total: totalQuestions })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle variant="dark" />
          <div
            className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${
              isLow ? 'animate-pulse bg-red-500 text-white' : 'bg-white/10 text-white'
            }`}
          >
            {timerDisplay}
          </div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100">
        <div
          className="h-full bg-[#E4002B] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex gap-1 px-5 py-2">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= questionIndex ? 'bg-[#0B2545]' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
}
