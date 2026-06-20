// components/admin/SubmissionsPipeline.tsx
//
// "Group subjective open text questions, image coordinate results, custom
// video payloads, and photo snapshots into unified evaluation card items" —
// straight from the brief. Photos and videos share a lane (both render via
// the same media preview) since graders judge them the same way.

'use client';

import { useSubmissionsQueue } from '@/lib/hooks/useSubmissionsQueue';
import { GradingCard } from './GradingCard';
import type { ResponseType } from '@/types/database';

const LANES: Array<{ title: string; types: ResponseType[] }> = [
  { title: 'Photo & Video Uploads', types: ['media_upload'] },
  { title: 'Hazard Taps', types: ['hazard_canvas'] },
  { title: 'Free Text', types: ['subjective_select'] },
  { title: 'Budget Canvas', types: ['budget_canvas'] },
];

export function SubmissionsPipeline() {
  const { submissions, loading } = useSubmissionsQueue();

  if (loading) {
    return <p className="text-sm text-slate-400">Loading submissions…</p>;
  }
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
        All caught up — nothing waiting for review.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {LANES.map((lane) => {
        const items = submissions.filter((s) => lane.types.includes(s.response_type));
        return (
          <div key={lane.title}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{lane.title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {items.length}
              </span>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-xs text-slate-300">Nothing here</p>
              ) : (
                items.map((s) => <GradingCard key={s.id} submission={s} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
