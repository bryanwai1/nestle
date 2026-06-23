// @ts-nocheck
// components/admin/MentalHealthManagerView.tsx
//
// Manager-only view of named wellbeing check-ins. The data is unreadable
// through the normal API (no select policy on mental_health_checkins) — the
// only way in is the password-gated get_mental_health_checkins() RPC, so a
// facilitator without the manager password sees nothing.

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Checkin = {
  id: string;
  batch_session_id: string | null;
  first_name: string;
  last_name: string | null;
  raw_score: number;
  bracket: 'low' | 'moderate' | 'high' | 'very_high';
  answers: number[];
  created_at: string;
};

const STATEMENTS = [
  'Stressed / overwhelmed',
  'Trouble sleeping',
  'Anxious / can’t relax',
  'Low / lacking motivation',
  'Hard to concentrate',
  'Easily irritated',
  'Lost interest',
  'Physically tired',
  'Hard to cope daily',
  'Cut off from people',
];

const BRACKET: Record<string, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  moderate: { label: 'Moderate', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  high: { label: 'High', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  very_high: { label: 'Very High', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

export function MentalHealthManagerView() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<Checkin[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function unlock() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.rpc('get_mental_health_checkins', { p_password: password });
    setLoading(false);
    if (error) {
      setError('Wrong password, or no access.');
      setRows(null);
      return;
    }
    setRows((data as Checkin[]) ?? []);
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-100">Manager access</h2>
        <p className="mt-1 text-xs text-slate-400">Enter the manager password to view wellbeing check-ins.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
          placeholder="Manager password"
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={unlock}
          disabled={loading || !password}
          className="mt-4 w-full rounded-lg bg-[#E4002B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    );
  }

  const counts = rows.reduce(
    (acc, r) => { acc[r.bracket] = (acc[r.bracket] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['low', 'moderate', 'high', 'very_high'] as const).map((b) => (
          <span key={b} className={`rounded-full border px-3 py-1 text-xs font-semibold ${BRACKET[b].cls}`}>
            {BRACKET[b].label}: {counts[b] ?? 0}
          </span>
        ))}
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
          Total: {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No check-ins yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const open = openId === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {r.first_name} {r.last_name ?? ''}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(r.created_at).toLocaleString()} · {r.batch_session_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-slate-200">{r.raw_score}/30</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BRACKET[r.bracket].cls}`}>
                      {BRACKET[r.bracket].label}
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="border-t border-slate-800 px-4 py-3">
                    <div className="grid gap-1.5">
                      {STATEMENTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{s}</span>
                          <span className="font-semibold tabular-nums text-slate-200">{r.answers?.[i] ?? '–'}/3</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
