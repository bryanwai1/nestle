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
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070f1f] text-sm text-slate-400">
        {t('common.loading')}
      </main>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070f1f] text-white">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#E4002B]/20 blur-[130px]" />
        <div className="absolute right-0 top-32 h-[28rem] w-[28rem] rounded-full bg-[#2a7fff]/20 blur-[130px]" />
      </div>

      <main className="relative mx-auto max-w-2xl px-4 py-8">
        {/* header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0B2545] to-[#0a1d3a] p-5 shadow-2xl">
          <div className="mb-3 h-1 w-full animate-pulse rounded-full bg-gradient-to-r from-[#E4002B] via-amber-400 to-[#2a7fff]" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
                {t('common.team')} {team.team_number}
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white">{t('hub.chooseModule')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <span className="rounded-full bg-[#E4002B] px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-[#E4002B]/30">
                {team.current_total_score} {t('common.points')}
              </span>
            </div>
          </div>
        </div>

        <p className="mb-4 px-1 text-xs text-slate-400">{t('hub.freeChoice')}</p>

        <div className="space-y-2.5">
          {MODULES.map((m) => {
            const status = progress[m.id] ?? 'not_started';
            const isMentalHealth = m.id === 'module-4-mental-health';
            return (
              <Link
                key={m.id}
                href={`/play/${m.id}`}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur transition hover:border-white/25 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#E4002B] to-[#a4001f] text-sm font-black text-white shadow-lg shadow-[#E4002B]/20">
                    {m.index}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{tx(m.title)}</p>
                    <p className="text-xs text-slate-400">
                      {isMentalHealth ? t('hub.anonymousCheckIn') : `${m.questionIds.length} ${t('hub.questionsCount')}`} ·{' '}
                      {Math.round((m.timerSeconds ?? 0) / 60)} {t('common.minutes')}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    status === 'completed'
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : status === 'in_progress'
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {t(STATUS_KEY[status])}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}