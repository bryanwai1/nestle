// components/admin/MentalHealthAggregateCard.tsx
//
// This queries anonymous_mental_health_aggregate (a VIEW), never the
// underlying anonymous_mental_health_metrics table directly — there's no
// individual row to show even if someone tried.

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AggregateRow {
  batch_session_id: string;
  submissions: number;
  avg_score: number;
  low_count: number;
  moderate_count: number;
  high_count: number;
  very_high_count: number;
}

export function MentalHealthAggregateCard() {
  const [rows, setRows] = useState<AggregateRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('anonymous_mental_health_aggregate')
      .select('*')
      .then(({ data }) => setRows((data as AggregateRow[]) ?? []));
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700">Module 4 · Mental Health (aggregate only)</h2>
      <p className="mb-3 text-xs text-slate-400">Individual responses are never linked to a team or name.</p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.batch_session_id} className="rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                {r.batch_session_id} · {r.submissions} submissions · avg {r.avg_score}/30
              </p>
              <div className="flex gap-1.5 text-[10px] font-medium">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Low {r.low_count}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Moderate {r.moderate_count}</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">High {r.high_count}</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Very High {r.very_high_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
