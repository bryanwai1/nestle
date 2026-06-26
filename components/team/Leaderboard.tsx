// components/team/Leaderboard.tsx

'use client';

import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Leaderboard({ limit = 3, myTeamId }: { limit?: number; myTeamId?: string }) {
  const { teams, loading } = useRealtimeLeaderboard(limit);
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('leaderboard.title')}</h3>
        <span className="text-xs text-slate-400">{t('leaderboard.top')} {limit}</span>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">{t('common.loading')}</p>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/podium.png" alt="" aria-hidden="true" className="mb-2 h-40 w-auto object-contain" />
          <p className="text-center text-sm font-medium text-slate-500">{t('leaderboard.empty')}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {teams.map((team, i) => {
            const medal = ['bg-amber-400', 'bg-slate-300', 'bg-amber-700'][i] ?? 'bg-[#0B2545]';
            return (
              <li
                key={team.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  team.id === myTeamId ? 'bg-[#E4002B]/5 font-semibold text-[#E4002B]' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${team.id === myTeamId ? 'bg-[#E4002B]' : medal}`}>
                    {i + 1}
                  </span>
                  {t('common.team')} {team.team_number}
                </span>
                <span className="tabular-nums">{team.current_total_score} {t('common.points')}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
