// app/page.tsx

'use client';

import { useTeam } from '@/lib/hooks/useTeam';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CreateTeamForm } from '@/components/team/CreateTeamForm';
import { Leaderboard } from '@/components/team/Leaderboard';
import { LanguageToggle } from '@/components/LanguageToggle';
import Link from 'next/link';

const WHY = [
  {
    wrap: 'bg-blue-50',
    chip: 'bg-blue-100 text-blue-600',
    title: { en: 'Learn', bm: 'Belajar' } as const,
    desc: { en: 'Build knowledge on safety, health and environment.', bm: 'Bina pengetahuan tentang keselamatan, kesihatan dan alam sekitar.' } as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
    ),
  },
  {
    wrap: 'bg-violet-50',
    chip: 'bg-violet-100 text-violet-600',
    title: { en: 'Earn Points', bm: 'Kumpul Mata' } as const,
    desc: { en: 'Complete modules and climb the leaderboard.', bm: 'Selesaikan modul dan naik papan markah.' } as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6"/><path d="m9 14-1.5 7L12 18l4.5 3L15 14"/></svg>
    ),
  },
  {
    wrap: 'bg-emerald-50',
    chip: 'bg-emerald-100 text-emerald-600',
    title: { en: 'Work Together', bm: 'Bekerjasama' } as const,
    desc: { en: 'Collaborate with your team and achieve more.', bm: 'Bekerjasama dengan pasukan dan capai lebih banyak.' } as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    wrap: 'bg-amber-50',
    chip: 'bg-amber-100 text-amber-600',
    title: { en: 'Win Prizes', bm: 'Menang Hadiah' } as const,
    desc: { en: 'Top teams win exciting Touch \u2019n Go rewards!', bm: 'Pasukan teratas menang ganjaran Touch \u2019n Go yang menarik!' } as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M2 12h20M12 8S9.5 2 6.5 4 12 8 12 8Zm0 0s2.5-6 5.5-4S12 8 12 8Z"/></svg>
    ),
  },
];

export default function HomePage() {
  const { team, loading } = useTeam();
  const { t, tx } = useLanguage();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/she-day-logo.png/image001.png" alt="Nestlé SHE Day" className="h-9 w-auto [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.9))_drop-shadow(0_0_12px_rgba(255,255,255,0.6))]" />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {!loading && (
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#0B2545] shadow-sm">
              {team ? `${t('common.team')} ${team.team_number} · ${team.current_total_score} ${t('common.points')}` : `${t('landing.noTeamYet')} · 0 ${t('common.points')}`}
            </span>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-[#0B2545] px-6 py-7 text-white shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home-hero.png" alt="" aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-3/5 object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545] via-[#0B2545]/90 to-[#0B2545]/10" />
        <div className="relative max-w-md">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90">{t('landing.eyebrow')}</span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">{t('landing.title')}</h1>
          <p className="mt-2 text-sm text-white/75">{t('landing.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['landing.tag.salesRegion', 'landing.tag.teamsOf3', 'landing.tag.modules', 'landing.tag.prizes'] as const).map((key) => (
              <span key={key} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">{t(key)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {team ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500">{t('landing.playingAs')}</p>
              <p className="mt-1 text-2xl font-bold text-[#0B2545]">{t('common.team')} {team.team_number}</p>
              <Link href="/play" className="mt-4 inline-block rounded-xl bg-[#E4002B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f]">
                {t('landing.continueToModules')}
              </Link>
            </div>
          ) : (
            !loading && <CreateTeamForm />
          )}
        </div>
        <div>
          <Leaderboard limit={3} myTeamId={team?.id} />
        </div>
      </div>

      {/* Why participate */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-bold text-[#0B2545]">{tx({ en: 'Why Participate?', bm: 'Mengapa Sertai?' })}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {WHY.map((c, i) => (
            <div key={i} className={`rounded-2xl ${c.wrap} p-4 text-center`}>
              <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl ${c.chip}`}>{c.icon}</div>
              <p className="text-sm font-bold text-[#0B2545]">{tx(c.title)}</p>
              <p className="mt-1 text-xs leading-snug text-slate-500">{tx(c.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Discrete admin link */}
      <div className="mt-8 text-center">
        <a href="/admin/login" className="text-xs text-slate-300 underline underline-offset-2 transition hover:text-slate-500">Facilitator access</a>
      </div>
    </main>
  );
}
