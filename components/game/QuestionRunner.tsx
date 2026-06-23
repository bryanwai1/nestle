// components/game/QuestionRunner.tsx
//
// PLAYER INTERFACE GUARDRAIL: players get NO correctness feedback, hints, or
// status on submit. Inputs just call onAnswer(data); nothing renders right/
// wrong until <ModuleCompleteScreen> mounts after the last question.
//
// RESUME + NO-RETAKE: on mount we read which questions this team has already
// answered (answers are saved per-question the instant they submit, so a dead
// phone loses nothing). Already-answered questions are skipped — a submitted
// question can never be re-opened, even mid-module, and a completed module
// can't be re-entered. That's the "it's a quiz, no second chances" rule.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = questions[index];

  const timer = useGameTimer({
    durationSeconds: gameModule?.timerSeconds ?? 600,
    onExpire: () => finishModule(),
  });

  // ---- Resume: figure out where this team should pick up --------------------
  useEffect(() => {
    let active = true;
    (async () => {
      // Module already finished (e.g. timed out previously)? Lock it.
      const { data: prog } = await supabase
        .from('team_module_progress')
        .select('status')
        .eq('team_id', team.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      if (!active) return;
      if (prog?.status === 'completed') {
        setCompleted(true);
        setReady(true);
        return;
      }

      // Which questions has this team already answered?
      const { data: rows } = await supabase
        .from('game_responses')
        .select('question_id')
        .eq('team_id', team.id)
        .eq('module_id', moduleId);
      if (!active) return;

      const answered = new Set((rows ?? []).map((r) => r.question_id as string));
      setAnsweredCount(answered.size);

      const firstUnanswered = questions.findIndex((q) => !answered.has(q.id));
      if (firstUnanswered === -1) {
        setCompleted(true); // everything already answered
      } else {
        setIndex(firstUnanswered);
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [supabase, team.id, moduleId, questions]);

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

      await supabase.rpc('apply_autograde', {
        p_team_id: team.id,
        p_module_id: moduleId,
        p_question_id: question.id,
      });

      setAnsweredCount((c) => c + 1);
      setSubmitting(false);

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

  if (!ready) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B2545]" />
      </div>
    );
  }

  if (completed) {
    return <ModuleCompleteScreen moduleId={moduleId} team={team} answeredCount={answeredCount} />;
  }

  // Continuous quiz numbering Q1..Q32 via each question's global `order`.
  const questionNumber = (current as GameQuestion & { order?: number }).order ?? index + 1;

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
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex items-center rounded-lg bg-[#E4002B] px-3 py-1 text-sm font-black tracking-tight text-white shadow-sm">
            Q{questionNumber}
          </span>
        </div>
        <p className="mb-6 text-lg font-medium text-slate-900">{tx(current.prompt)}</p>
        <QuestionInputSwitch
          key={current.id}
          question={current}
          teamId={team.id}
          disabled={submitting}
          onAnswer={(data, mediaUrl) => handleAnswer(current, data, mediaUrl)}
        />
      </div>
    </div>
  );
}
