// app/admin/dashboard/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LiveLeaderboardTicker } from '@/components/admin/LiveLeaderboardTicker';
import { SpeedBonusToggle } from '@/components/admin/SpeedBonusToggle';
import { MentalHealthAggregateCard } from '@/components/admin/MentalHealthAggregateCard';
import { TeamAnswersBoard } from '@/components/admin/TeamAnswersBoard';
import { FreezeToggle } from '@/components/admin/FreezeToggle';
import { TeamReleasePanel } from '@/components/admin/TeamReleasePanel';

export default function AdminDashboardPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  const navLinks = [
    { href: '/admin/preview', label: '👁 Preview questions' },
    { href: '/admin/teams', label: '📊 Live team tracker' },
    { href: '/admin/report', label: '⬇ Download report' },
    { href: '/admin/answer-keys', label: '🔑 Answer keys' },
    { href: '/admin/mental-health', label: '💙 Wellbeing (manager)' },
    { href: '/leaderboard', label: '❤️ Live Leaderboard', external: true },
    { href: '/winner', label: '🏆 Winner screen', external: true },
  ];

  return (
    <div className="min-h-screen bg-[#070f1f] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#E4002B]/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[#2a7fff]/20 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0B2545] to-[#0a1d3a] p-5 shadow-2xl">
          <div className="mb-3 h-1 w-full animate-pulse rounded-full bg-gradient-to-r from-[#E4002B] via-amber-400 to-[#2a7fff]" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
                SHE Day 2026
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Event Coordination Dashboard
              </h1>
            </div>
            <button
              onClick={signOut}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Sign out
            </button>
          </div>

          {/* Quick nav */}
          <div className="mt-4 flex flex-wrap gap-2">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Top row: leaderboard + side cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LiveLeaderboardTicker />
          </div>
          <div className="space-y-4">
            <FreezeToggle />
            <TeamReleasePanel />
            <SpeedBonusToggle />
            <MentalHealthAggregateCard />
          </div>
        </div>

        {/* Per-team answers */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#E4002B]" />
            <h2 className="text-lg font-bold text-white">Team Answers &amp; Grading</h2>
          </div>
          <TeamAnswersBoard />
        </section>
      </main>
    </div>
  );
}
