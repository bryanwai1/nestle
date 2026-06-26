// components/game/ModuleTimerBar.tsx
//
// The module-progress card: "Module N of 10 · <title>" + "Question X of Y" +
// a slim progress bar. The countdown timer now lives in the play top bar, so
// this component is purely the progress header. It still fires onFirstRender
// once so the runner can mark the module started.

'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function ModuleTimerBar({
  moduleIndex,
  totalModules,
  moduleTitle,
  questionIndex,
  totalQuestions,
  onFirstRender,
}: {
  moduleIndex: number;
  totalModules: number;
  moduleTitle: string;
  questionIndex: number;
  totalQuestions: number;
  onFirstRender: () => void;
}) {
  const fired = useRef(false);
  const { t, tx } = useLanguage();

  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      onFirstRender();
    }
  }, [onFirstRender]);

  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#E4002B]/10 px-2.5 py-1 text-xs font-bold text-[#E4002B]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
            {tx({ en: `Module ${moduleIndex} of ${totalModules}`, bm: `Modul ${moduleIndex} / ${totalModules}` })}
          </span>
          <span className="truncate text-sm font-bold text-[#0B2545]">{moduleTitle}</span>
        </div>
        <span className="shrink-0 text-sm font-medium text-slate-500">
          {t('runner.questionOf', { current: questionIndex + 1, total: totalQuestions })}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#E4002B] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
