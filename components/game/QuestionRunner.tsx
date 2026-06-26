// components/game/QuestionRunner.tsx
//
// PLAYER INTERFACE GUARDRAIL: players get NO correctness feedback, hints, or
// score on submit. Inputs just call onAnswer(data); nothing renders right/
// wrong until <ModuleCompleteScreen> mounts after the last question.
//
// RESUME + NO-RETAKE: on mount we read which questions this team has already
// answered. Already-answered questions are skipped — a submitted question can
// never be re-opened, even mid-module, and a completed module can't be
// re-entered. "It's a quiz, no second chances."
//
// This pass restyles the screen to match the SHE Day mockup (top bar, module
// progress card, QUESTION 0X header, progress ring + question dots) WITHOUT
// touching any of the above logic. No live score is shown during play.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useGameTimer } from '@/lib/hooks/useGameTimer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MODULES, getModule, getQuestionsForModule } from '@/lib/game/questions';
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
        setCompleted(true);
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
  const progressPct = Math.round((index / questions.length) * 100);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Top bar */}
      <header className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <Link
          href="/play"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <span aria-hidden="true">←</span> {tx({ en: 'Exit', bm: 'Keluar' })}
        </Link>
        <p className="hidden text-sm font-bold text-[#0B2545] sm:block">SHE Day Challenge 2026</p>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${
              timer.isLow ? 'animate-pulse bg-red-500 text-white' : 'bg-slate-100 text-[#0B2545]'
            }`}
          >
            ⏱ {timer.display}
          </span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_15rem]">
        {/* Main column */}
        <div>
          <ModuleTimerBar
            moduleIndex={gameModule.index}
            totalModules={MODULES.length}
            moduleTitle={tx(gameModule.title)}
            questionIndex={index}
            totalQuestions={questions.length}
            onFirstRender={markModuleStarted}
          />

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-4">
              <div className="shrink-0 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#E4002B]">{tx({ en: 'Question', bm: 'Soalan' })}</p>
                <p className="text-3xl font-black leading-none text-[#E4002B]">{String(questionNumber).padStart(2, '0')}</p>
              </div>
              <div className="h-12 w-px shrink-0 bg-slate-200" />
              <p className="text-lg font-bold leading-snug text-[#0B2545]">{tx(current.prompt)}</p>
            </div>

            <QuestionInputSwitch
              key={current.id}
              question={current}
              teamId={team.id}
              disabled={submitting}
              onAnswer={(data, mediaUrl) => handleAnswer(current, data, mediaUrl)}
            />
          </div>
        </div>

        {/* Sidebar (desktop only) — progress, NO score */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col items-center">
              <div className="mb-3 text-4xl" aria-hidden="true">🏆</div>
              <p className="mb-2 text-xs font-medium text-slate-500">{tx({ en: 'Your Progress', bm: 'Kemajuan Anda' })}</p>
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E4002B" strokeWidth="3.5" strokeLinecap="round" pathLength={100} strokeDasharray={`${progressPct} 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0B2545]">{progressPct}%</span>
              </div>
            </div>

            <p className="mb-2 text-xs font-semibold text-slate-500">{tx({ en: 'Questions', bm: 'Soalan' })}</p>
            <div className="space-y-1.5">
              {questions.map((q, i) => {
                const done = i < index;
                const cur = i === index;
                return (
                  <div
                    key={q.id}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-bold ${
                      cur
                        ? 'border-[#E4002B] text-[#E4002B]'
                        : done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {i + 1}
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
