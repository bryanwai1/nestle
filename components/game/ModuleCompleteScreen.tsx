// components/game/ModuleCompleteScreen.tsx
//
// This is the ONLY screen in the whole question flow allowed to mention
// points — and only because the module is now fully submitted. Even here,
// per-question correctness is never shown, just the module's running total
// and how much of it is still pending a human's review.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MODULES, getModule } from '@/lib/game/questions';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

export function ModuleCompleteScreen({
  moduleId,
  team,
  answeredCount,
}: {
  moduleId: string;
  team: Team;
  answeredCount: number;
}) {
  const gameModule = getModule(moduleId);
  const [summary, setSummary] = useState<{ graded: number; pending: number; pointsSoFar: number } | null>(null);
  const { t, tx } = useLanguage();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('game_responses')
      .select('is_correct, points_awarded')
      .eq('team_id', team.id)
      .eq('module_id', moduleId)
      .then(({ data }) => {
        if (!data) return;
        const graded = data.filter((r) => r.is_correct !== null).length;
        const pending = data.length - graded;
        const pointsSoFar = data.reduce((s, r) => s + (r.points_awarded ?? 0), 0);
        setSummary({ graded, pending, pointsSoFar });
      });
  }, [team.id, moduleId]);

  const nextModule = gameModule ? MODULES.find((m) => m.index === gameModule.index + 1) : undefined;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B2545]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900">{t('complete.title')}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {gameModule && tx(gameModule.title)} • {answeredCount} {t('complete.answersRecorded')} {t('common.team')} {team.team_number}
      </p>

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-semibold text-[#0B2545]">{summary.pointsSoFar}</p>
            <p className="text-xs text-slate-500">{t('complete.pointsSoFar')}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-semibold text-slate-700">{summary.pending}</p>
            <p className="text-xs text-slate-500">{t('complete.awaitingReview')}</p>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">{t('complete.liveUpdateNote')}</p>

      <div className="mt-8 flex flex-col gap-2">
        {nextModule ? (
          <Link
            href={`/play/${nextModule.id}`}
            className="rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f]"
          >
            {t('complete.startModule')} {nextModule.index}: {tx(nextModule.title)}
          </Link>
        ) : (
          <p className="rounded-xl bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
            {t('complete.allDone')}
          </p>
        )}
        <Link href="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
          {t('complete.backToLeaderboard')}
        </Link>
      </div>
    </div>
  );
}
