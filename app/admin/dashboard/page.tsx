// app/admin/dashboard/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LiveLeaderboardTicker } from '@/components/admin/LiveLeaderboardTicker';
import { SubmissionsPipeline } from '@/components/admin/SubmissionsPipeline';
import { SpeedBonusToggle } from '@/components/admin/SpeedBonusToggle';
import { MentalHealthAggregateCard } from '@/components/admin/MentalHealthAggregateCard';

export default function AdminDashboardPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SHE Day 2026</p>
          <h1 className="text-xl font-bold text-slate-900">Event Coordination Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/winner"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#E4002B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c4001f]"
          >
            🏆 Winner Screen
          </a>
          <button onClick={signOut} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveLeaderboardTicker />
        </div>
        <div className="space-y-4">
          <SpeedBonusToggle />
          <MentalHealthAggregateCard />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Submissions Pipeline</h2>
        <SubmissionsPipeline />
      </section>
    </main>
  );
}
