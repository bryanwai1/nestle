// components/admin/LiveLeaderboardTicker.tsx

'use client';

import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';

export function LiveLeaderboardTicker() {
  const { teams, loading } = useRealtimeLeaderboard();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Live Leaderboard</h2>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <p className="p-5 text-sm text-slate-400">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-2">#</th>
                <th className="px-2 py-2">Team</th>
                <th className="px-2 py-2">Members</th>
                <th className="px-5 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr key={t.id} className="border-t border-slate-50">
                  <td className="px-5 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-2.5 font-semibold text-[#0B2545]">Team {t.team_number}</td>
                  <td className="px-2 py-2.5 text-xs text-slate-500">
                    {t.member_1_name}, {t.member_2_name}, {t.member_3_name}
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{t.current_total_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
