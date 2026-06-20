// app/play/page.tsx

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/lib/hooks/useTeam';
import { useModuleProgress } from '@/lib/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MODULES } from '@/lib/game/questions';
import type { UIKey } from '@/lib/i18n/ui';

const STATUS_KEY: Record<string, UIKey> = {
  not_started: 'hub.status.notStarted',
  in_progress: 'hub.status.inProgress',
  completed: 'hub.status.completed',
};

export default function PlayHubPage() {
  const { team, loading } = useTeam();
  const progress = useModuleProgress(team?.id);
  const router = useRouter();
  const { t, tx } = useLanguage();

  useEffect(() => {
    if (!loading && !team) router.replace('/');
  }, [loading, team, router]);

  if (loading || !team) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-center text-slate-400">{t('common.loading')}</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('common.team')} {team.team_number}</p>
          <h1 className="text-xl font-bold text-slate-900">{t('hub.chooseModule')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <span className="rounded-full bg-[#0B2545] px-3 py-1.5 text-sm font-semibold text-white">
            {team.current_total_score} {t('common.points')}
          </span>
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-400">{t('hub.freeChoice')}</p>

      <div className="space-y-2">
        {MODULES.map((m) => {
          const status = progress[m.id] ?? 'not_started';
          const isMentalHealth = m.id === 'module-4-mental-health';
          return (
            <Link
              key={m.id}
              href={`/play/${m.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#0B2545]/5 text-sm font-bold text-[#0B2545]">
                  {m.index}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{tx(m.title)}</p>
                  <p className="text-xs text-slate-400">
                    {isMentalHealth ? t('hub.anonymousCheckIn') : `${m.questionIds.length} ${t('hub.questionsCount')}`} ·{' '}
                    {Math.round((m.timerSeconds ?? 0) / 60)} {t('common.minutes')}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : status === 'in_progress'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t(STATUS_KEY[status])}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
