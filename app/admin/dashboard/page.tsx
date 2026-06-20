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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SHE Day 2026</p>
          <h1 className="text-xl font-bold text-slate-900">Event Coordination Dashboard</h1>
        </div>
        <button onClick={signOut} className="text-sm font-medium text-slate-400 hover:text-slate-600">
          Sign out
        </button>
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
