// components/game/QuestionRunner.tsx
//
// PLAYER INTERFACE GUARDRAIL (from the brief): players get NO correctness
// feedback, hints, or status on submit. This component is the one place
// that rule is enforced — every input component below it just calls
// `onAnswer(data)` and has no idea whether it was right. Nothing renders a
// checkmark, a color change, or a toast until <ModuleCompleteScreen> mounts,
// which only happens after the last question in the module is submitted.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameTimer } from '@/lib/hooks/useGameTimer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getModule, getQuestionsForModule } from '@/lib/game/questions';
import type { Database } from '@/types/database';
import type { GameQuestion, ResponseDataByType } from '@/types/game';
import { QuestionInputSwitch } from './QuestionInputSwitch';
import { ModuleCompleteScreen } from './ModuleCompleteScreen';
import { ModuleTimerBar } from './ModuleTimerBar';

type Team = Database['public']['Tables']['teams']['Row'];

export function QuestionRunner({ moduleId, team }: { moduleId: string; team: Team }) {
  const gameModule = getModule(moduleId);
  const questions = useMemo(() => getQuestionsForModule(moduleId), [moduleId]);
  const supabase = createClient();
  const { t, tx } = useLanguage();

  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = questions[index];

  const timer = useGameTimer({
    durationSeconds: gameModule?.timerSeconds ?? 600,
    onExpire: () => finishModule(), // time's up → auto-submit whatever's answered
  });

  const markModuleStarted = useCallback(async () => {
    await supabase.from('team_module_progress').upsert(
      { team_id: team.id, module_id: moduleId, status: 'in_progress', started_at: new Date().toISOString() },
      { onConflict: 'team_id,module_id' }
    );
  }, [supabase, team.id, moduleId]);

  const finishModule = useCallback(async () => {
    await supabase.from('team_module_progress').upsert(
      { team_id: team.id, module_id: moduleId, status: 'completed', completed_at: new Date().toISOString() },
      { onConflict: 'team_id,module_id' }
    );
    setCompleted(true);
  }, [supabase, team.id, moduleId]);

  const handleAnswer = useCallback(
    async <Q extends GameQuestion>(
      question: Q,
      data: ResponseDataByType[Q['responseType']],
      mediaUrl?: string
    ) => {
      setSubmitting(true);

      // 1. Persist the raw answer. RLS (responses_insert_own) guarantees the
      //    client cannot set is_correct/points_awarded on this insert no
      //    matter what it sends — those columns are forced to null/0/null.
      await supabase.from('game_responses').upsert(
        {
          team_id: team.id,
          module_id: moduleId,
          question_id: question.id,
          response_type: question.responseType,
          response_data: data as Record<string, unknown>,
          media_url: mediaUrl ?? null,
        },
        { onConflict: 'team_id,module_id,question_id' }
      );

      // 2. Ask the database to grade what it just received. apply_autograde
      //    re-reads the row itself and checks it against
      //    question_answer_keys — the client never gets to claim its own
      //    score. For manual-review question types this is a harmless no-op
      //    (no answer key exists, row stays is_correct = null for the
      //    admin Submissions Pipeline). See supabase/migrations/0002_*.sql.
      await supabase.rpc('apply_autograde', {
        p_team_id: team.id,
        p_module_id: moduleId,
        p_question_id: question.id,
      });

      setAnsweredCount((c) => c + 1);
      setSubmitting(false);

      // ZERO feedback here. No "correct!" no color, nothing. Just advance.
      if (index < questions.length - 1) {
        setIndex((i) => i + 1);
      } else {
        finishModule();
      }
    },
    [supabase, team.id, moduleId, index, questions.length, finishModule]
  );

  if (!gameModule || questions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        {t('runner.noStandardFlow')}
      </div>
    );
  }

  if (completed) {
    return <ModuleCompleteScreen moduleId={moduleId} team={team} answeredCount={answeredCount} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ModuleTimerBar
        moduleTitle={tx(gameModule.title)}
        questionIndex={index}
        totalQuestions={questions.length}
        timerDisplay={timer.display}
        isLow={timer.isLow}
        onFirstRender={markModuleStarted}
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-6 text-lg font-medium text-slate-900">{tx(current.prompt)}</p>
        <QuestionInputSwitch
          key={current.id} // remount cleanly per question — no stale local state
          question={current}
          teamId={team.id}
          disabled={submitting}
          onAnswer={(data, mediaUrl) => handleAnswer(current, data, mediaUrl)}
        />
      </div>
    </div>
  );
}
