// app/page.tsx

'use client';

import { useTeam } from '@/lib/hooks/useTeam';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CreateTeamForm } from '@/components/team/CreateTeamForm';
import { Leaderboard } from '@/components/team/Leaderboard';
import { LanguageToggle } from '@/components/LanguageToggle';
import Link from 'next/link';

export default function HomePage() {
  const { team, loading } = useTeam();
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 overflow-hidden rounded-2xl bg-[#0B2545] text-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-white/60">{t('landing.eyebrow')}</p>
            <p className="text-lg font-bold">{t('landing.orgName')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle variant="dark" />
            {!loading && (
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                {team ? `${t('common.team')} ${team.team_number} · ${team.current_total_score} ${t('common.points')}` : `${t('landing.noTeamYet')} · 0 ${t('common.points')}`}
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#0B2545]/95 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#E4002B]">{t('landing.category')}</p>
          <h1 className="mt-1 text-2xl font-bold">{t('landing.title')}</h1>
          <p className="mt-1 text-sm text-white/70">{t('landing.subtitle')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['landing.tag.salesRegion', 'landing.tag.teamsOf3', 'landing.tag.modules', 'landing.tag.prizes'] as const).map((key) => (
              <span key={key} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                {t(key)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {team ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">{t('landing.playingAs')}</p>
          <p className="text-2xl font-bold text-[#0B2545]">{t('common.team')} {team.team_number}</p>
          <Link
            href="/play"
            className="mt-4 inline-block rounded-xl bg-[#E4002B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f]"
          >
            {t('landing.continueToModules')}
          </Link>
        </div>
      ) : (
        !loading && <div className="mb-6"><CreateTeamForm /></div>
      )}

      <Leaderboard limit={3} myTeamId={team?.id} />

      {/* Discrete admin link — shown at the very bottom for facilitators */}
      <div className="mt-8 text-center">
        <a href="/admin/login" className="text-xs text-slate-300 hover:text-slate-500 underline underline-offset-2 transition">
          Facilitator access
        </a>
      </div>
    </main>
  );
}
