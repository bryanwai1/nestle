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

// One vibrant accent per module — keeps the hub colorful but tidy.
const ACCENTS = ['#E4002B', '#F5A623', '#2DD4BF', '#3B82F6', '#8B5CF6', '#EC4899', '#22C55E', '#0EA5E9', '#F97316', '#14B8A6'];

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">
        {t('common.loading')}
      </main>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* soft colorful accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#E4002B]/10 blur-[110px]" />
        <div className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-[#3B82F6]/10 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#F5A623]/10 blur-[110px]" />
      </div>

      <main className="relative mx-auto max-w-2xl px-4 py-8">
        {/* header */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 h-1.5 w-full animate-pulse rounded-full bg-gradient-to-r from-[#E4002B] via-[#F5A623] to-[#3B82F6]" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E4002B]">
                {t('common.team')} {team.team_number}
              </p>
              <h1 className="text-2xl font-black tracking-tight text-[#0B2545]">{t('hub.chooseModule')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <span className="rounded-full bg-gradient-to-r from-[#E4002B] to-[#ff3355] px-3.5 py-1.5 text-sm font-bold text-white shadow-md shadow-[#E4002B]/25">
                {team.current_total_score} {t('common.points')}
              </span>
            </div>
          </div>
        </div>

        <p className="mb-4 px-1 text-xs text-slate-400">{t('hub.sequentialNote')}</p>

        <div className="space-y-2.5">
          {MODULES.map((m, idx) => {
            const status = progress[m.id] ?? 'not_started';
            const isMentalHealth = m.id === 'module-4-mental-health';
            const accent = ACCENTS[(m.index - 1) % ACCENTS.length];
            const prevModule = MODULES[idx - 1];
            const isLocked = idx > 0 && (progress[prevModule.id] ?? 'not_started') !== 'completed';
            const inner = (
              <>
                <div className="flex items-center gap-3.5">
                  <span
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-base font-black text-white shadow-sm"
                    style={{ backgroundColor: isLocked ? '#94a3b8' : accent, boxShadow: `0 6px 16px ${isLocked ? '#94a3b8' : accent}33` }}
                  >
                    {isLocked ? '🔒' : m.index}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${isLocked ? 'text-slate-400' : 'text-[#0B2545]'}`}>{tx(m.title)}</p>
                    <p className="text-xs text-slate-400">
                      {isMentalHealth ? t('hub.anonymousCheckIn') : `${m.questionIds.length} ${t('hub.questionsCount')}`} ·{' '}
                      {Math.round((m.timerSeconds ?? 0) / 60)} {t('common.minutes')}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    isLocked
                      ? 'bg-slate-100 text-slate-400'
                      : status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : status === 'in_progress'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isLocked ? t('hub.status.locked') : t(STATUS_KEY[status])}
                </span>
              </>
            );
            if (isLocked) {
              return (
                <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 opacity-60">
                  {inner}
                </div>
              );
            }
            return (
              <Link
                key={m.id}
                href={`/play/${m.id}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}