// components/admin/GradingCard.tsx

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QUESTIONS } from '@/lib/game/questions';
import { summarizeBudgetCanvas } from '@/lib/game/scoring';
import type { QueuedSubmission } from '@/lib/hooks/useSubmissionsQueue';

export function GradingCard({ submission }: { submission: QueuedSubmission }) {
  const [grading, setGrading] = useState(false);
  const question = QUESTIONS[submission.question_id];

  async function grade(isCorrect: boolean, customPoints?: number) {
    setGrading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from('game_responses')
      .update({
        is_correct: isCorrect,
        points_awarded: customPoints ?? (isCorrect ? 10 : -5),
        evaluated_by: user?.id ?? null,
        evaluated_at: new Date().toISOString(),
      })
      .eq('id', submission.id);
    // Row disappears from the queue automatically — useSubmissionsQueue's
    // realtime subscription re-fetches on this update (is_correct no longer null).
    setGrading(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#0B2545]">Team {submission.teams?.team_number ?? '?'}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{submission.question_id}</span>
      </div>
      <p className="mb-3 text-sm text-slate-700">{question?.prompt.en}</p>

      <SubmissionPreview submission={submission} />

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={grading}
          onClick={() => grade(true)}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          Correct (+10)
        </button>
        <button
          type="button"
          disabled={grading}
          onClick={() => grade(false)}
          className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          Incorrect (−5)
        </button>
        <button
          type="button"
          disabled={grading}
          onClick={() => grade(true, 0)}
          title="Mark seen, award zero (neither right nor wrong)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
        >
          0 pts
        </button>
      </div>
    </div>
  );
}

function SubmissionPreview({ submission }: { submission: QueuedSubmission }) {
  switch (submission.response_type) {
    case 'media_upload':
      return submission.media_url ? (
        submission.media_url.match(/\.(mp4|mov|webm)$/i) ? (
          <video src={submission.media_url} controls className="w-full rounded-lg bg-slate-900" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={submission.media_url} alt="Submission" className="w-full rounded-lg" />
        )
      ) : (
        <p className="text-xs text-slate-400">No media URL recorded.</p>
      );

    case 'hazard_canvas': {
      const taps = (submission.response_data.taps as Array<{ x: number; y: number }>) ?? [];
      const question = QUESTIONS[submission.question_id];
      const imageUrl = question && question.responseType === 'hazard_canvas' ? question.imageUrl : undefined;
      return (
        <div className="relative overflow-hidden rounded-lg border border-slate-200" style={{ aspectRatio: '4 / 3' }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          )}
          {taps.map((t, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#E4002B] text-center text-[9px] font-bold leading-4 text-white"
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: 16, height: 16 }}
            >
              {i + 1}
            </div>
          ))}
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {taps.length} taps
          </span>
        </div>
      );
    }

    case 'subjective_select': {
      const data = submission.response_data as { selected?: string[]; freeText?: string };
      return (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-medium">{(data.selected ?? []).join(', ')}</p>
          {data.freeText && <p className="mt-1 italic text-slate-500">&ldquo;{data.freeText}&rdquo;</p>}
        </div>
      );
    }

    case 'budget_canvas': {
      const question = QUESTIONS[submission.question_id];
      if (!question || question.responseType !== 'budget_canvas') return null;
      const data = submission.response_data as {
        placements: Array<{ foodId: string; quadrant: string }>;
        totalCostRM: number;
      };
      const summary = summarizeBudgetCanvas(question, data as never);
      return (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {question.quadrants.map((q) => (
            <p key={q.id}>
              <span className="font-medium">{q.label.en}:</span> RM{summary.byQuadrant[q.id]?.costRM.toFixed(2) ?? '0.00'} ·{' '}
              {summary.byQuadrant[q.id]?.calories ?? 0} kcal
            </p>
          ))}
          <p className={`mt-1 font-semibold ${summary.withinBudget ? 'text-emerald-600' : 'text-amber-600'}`}>
            Total RM{summary.totalCost.toFixed(2)} {summary.withinBudget ? '(within budget)' : '(over budget)'}
          </p>
        </div>
      );
    }

    default:
      return (
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500">
          {JSON.stringify(submission.response_data, null, 2)}
        </pre>
      );
  }
}
