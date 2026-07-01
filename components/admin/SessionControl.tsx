// components/admin/SessionControl.tsx
// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SESSION_OPTIONS = [
  'ECR 1 - 1 Jul 2026 (9am-12.30pm)',
  'ECR 1 - 1 Jul 2026 (1pm-5pm)',
  'Sabah - 3 Jul 2026 (1pm-5pm)',
  'ECR2(KB) - 6 Jul 2026 (1pm-5pm)',
  'ECR2(KT) - 7 Jul 2026 (1pm-5pm)',
  'Southern - 14 Jul 2026 (9am-12.30pm)',
  'Southern - 14 Jul 2026 (1pm-5pm)',
  'Northern 2 - 22 Jul 2026 (1pm-5pm)',
  'Central 1 - 4 Aug 2026 (9am-12.30pm)',
  'Central 1 - 4 Aug 2026 (1pm-5pm)',
  'Central 1 - 5 Aug 2026 (9am-12.30pm)',
  'Central 1 - 5 Aug 2026 (1pm-5pm)',
  'Central 2 - 6 Aug 2026 (9am-12.30pm)',
  'Central 2 - 6 Aug 2026 (1pm-5pm)',
  'Sarawak - 14 Aug 2026 (9am-12.30pm)',
  'Sarawak - 14 Aug 2026 (1pm-5pm)',
  'Northern 1 - 2 Sep 2026 (9am-12.30pm)',
  'Northern 1 - 2 Sep 2026 (1pm-5pm)',
];

export function SessionControl() {
  const [current, setCurrent] = useState<string | null>(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await (supabase as any)
        .from('event_sessions')
        .select('name')
        .eq('is_active', true)
        .single();
      if (data) setCurrent(data.name);
    }
    load();
  }, []);

  async function startNewSession() {
    if (!selected) return;
    setBusy(true);
    await (supabase as any).rpc('start_new_session', { p_name: selected });
    setCurrent(selected);
    setSelected('');
    setConfirm(false);
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B2545] to-[#0a1d3a] p-5 shadow-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">Session Control</p>
      <h3 className="mt-1 text-lg font-bold text-white">Active Session</h3>
      <p className="mt-1 text-sm text-emerald-400 font-medium">{current ?? 'Loading...'}</p>
      <div className="mt-4 space-y-2">
        <select value={selected} onChange={(e) => { setSelected(e.target.value); setConfirm(false); }}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none">
          <option value="">Select next session...</option>
          {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {selected && !confirm && (
          <button onClick={() => setConfirm(true)}
            className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">
            Start New Session →
          </button>
        )}
        {confirm && (
          <div className="rounded-xl bg-red-900/40 border border-red-500/40 p-3">
            <p className="text-xs text-red-300 mb-2">⚠️ This will start a fresh game for <strong>{selected}</strong>. Old data is preserved but hidden. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={startNewSession} disabled={busy}
                className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50">
                {busy ? 'Starting...' : 'Yes, start new session'}
              </button>
              <button onClick={() => setConfirm(false)}
                className="flex-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
