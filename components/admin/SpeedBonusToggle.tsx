// components/admin/SpeedBonusToggle.tsx
//
// Calls the /api/speed-bonus route handler (service-role, see app/api/
// speed-bonus/route.ts) rather than writing to session_speed_bonus directly,
// so the "replace the existing holder" delete+insert happens atomically.

'use client';

import { useState } from 'react';
import { MODULES } from '@/lib/game/questions';
import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';
import type { ModuleId } from '@/types/game';

export function SpeedBonusToggle() {
  const { teams } = useRealtimeLeaderboard();
  const [moduleId, setModuleId] = useState<ModuleId>(MODULES[0].id);
  const [teamId, setTeamId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function award() {
    if (!teamId) return;
    setBusy(true);
    setMessage(null);

    // Same-origin fetch — the browser sends the Supabase auth cookie
    // automatically, which app/api/speed-bonus/route.ts reads via
    // lib/supabase/server.ts to confirm an admin is signed in.
    const res = await fetch('/api/speed-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, moduleId }),
    });
    setBusy(false);
    setMessage(res.ok ? '+50 awarded' : 'Failed — try again');
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">⚡ Session Speed Bonus (+50)</h2>
      <div className="space-y-2">
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value as ModuleId)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {MODULES.map((m) => (
            <option key={m.id} value={m.id}>
              Module {m.index}: {m.title.en}
            </option>
          ))}
        </select>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Choose fastest team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              Team {t.team_number}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={award}
          disabled={!teamId || busy}
          className="w-full rounded-lg bg-[#E4002B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#c4001f] disabled:opacity-50"
        >
          {busy ? 'Awarding…' : 'Award +50 Bonus'}
        </button>
        {message && <p className="text-center text-xs text-slate-500">{message}</p>}
      </div>
    </div>
  );
}
