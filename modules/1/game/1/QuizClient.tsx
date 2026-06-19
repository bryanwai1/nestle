"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  QUIZ_QUESTIONS,
  POINTS_CORRECT_BASE,
  POINTS_SPEED_BONUS,
  GAME_CARD_THRESHOLD,
  PASSING_SCORE_PCT,
  type QuizQuestion,
} from "./quiz-data";

// ── Types ────────────────────────────────────────────────────
type Phase = "intro" | "playing" | "feedback" | "results";

interface Answer {
  questionId: number;
  selectedId: string | null;
  correct: boolean;
  timeUsed: number;
  points: number;
}

// ── Helpers ──────────────────────────────────────────────────
function calcPoints(correct: boolean, timeUsed: number, timeLimit: number): number {
  if (!correct) return 0;
  const speedRatio = Math.max(0, 1 - timeUsed / timeLimit);
  return POINTS_CORRECT_BASE + Math.round(POINTS_SPEED_BONUS * speedRatio);
}

function pct(n: number, total: number) {
  return Math.round((n / total) * 100);
}

// ── Sub-components ───────────────────────────────────────────
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const ratio = seconds / total;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * ratio;
  const color = ratio > 0.5 ? "#00853F" : ratio > 0.25 ? "#F5A623" : "#E2001A";

  return (
    <div className="relative w-14 h-14 flex items-center justify-center" aria-label={`${seconds} seconds remaining`}>
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#EBEEF4" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
      </svg>
      <span
        className="absolute text-[15px] font-bold"
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}

function ProgressDots({ total, current, answers }: { total: number; current: number; answers: Answer[] }) {
  return (
    <div className="flex gap-1 flex-wrap justify-center" aria-label="Question progress">
      {Array.from({ length: total }).map((_, i) => {
        const ans = answers[i];
        let bg = "bg-gray-200";
        if (i < current) bg = ans?.correct ? "bg-nestle-green" : "bg-nestle-red";
        if (i === current) bg = "bg-nestle-blue";
        return <div key={i} className={`w-2 h-2 rounded-full transition-colors ${bg}`} />;
      })}
    </div>
  );
}

// ── Main Quiz Component ──────────────────────────────────────
export default function RapidFireQuiz({ teamId = "3" }: { teamId?: string }) {
  const router = useRouter();
  const [phase, setPhase]             = useState<Phase>("intro");
  const [qIndex, setQIndex]           = useState(0);
  const [selected, setSelected]       = useState<string | null>(null);
  const [answers, setAnswers]         = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [saving, setSaving]           = useState(false);
  const timerRef                      = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef                  = useRef<number>(0);

  const currentQ: QuizQuestion = QUIZ_QUESTIONS[qIndex];
  const totalQ = QUIZ_QUESTIONS.length;

  // ── Timer ────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback((limit: number) => {
    stopTimer();
    setTimeLeft(limit);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          // Time expired — auto-submit null
          setSelected("__timeout__");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // When playing phase begins / question changes
  useEffect(() => {
    if (phase === "playing") {
      setSelected(null);
      startTimer(currentQ.timeLimit);
    }
    return stopTimer;
  }, [phase, qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // When an option is selected (or timeout triggers)
  useEffect(() => {
    if (selected === null) return;
    stopTimer();

    const timeUsed = Math.min(
      currentQ.timeLimit,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );
    const timedOut  = selected === "__timeout__";
    const correct   = !timedOut && !!currentQ.options.find((o) => o.id === selected)?.isCorrect;
    const points    = calcPoints(correct, timeUsed, currentQ.timeLimit);

    setAnswers((prev) => [
      ...prev,
      { questionId: currentQ.id, selectedId: timedOut ? null : selected, correct, timeUsed, points },
    ]);
    setPhase("feedback");
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ───────────────────────────────────────────
  function nextQuestion() {
    if (qIndex + 1 < totalQ) {
      setQIndex((i) => i + 1);
      setPhase("playing");
    } else {
      setPhase("results");
    }
  }

  // ── Save to Supabase ─────────────────────────────────────
  async function saveResults(finalAnswers: Answer[]) {
    const supabase = createClient();
    if (!supabase) return;
    const totalPoints = finalAnswers.reduce((s, a) => s + a.points, 0);
    const correctCount = finalAnswers.filter((a) => a.correct).length;
    const gameCard = correctCount >= GAME_CARD_THRESHOLD ? 1 : 0;

    setSaving(true);
    try {
      await supabase.from("scores").upsert({
        team_id: teamId,
        module_id: 1,
        game_id: 1,
        points: totalPoints,
        time_seconds: finalAnswers.reduce((s, a) => s + a.timeUsed, 0),
        game_cards: gameCard,
      });
      await supabase.from("quiz_responses").insert({
        team_id: teamId,
        module_id: 1,
        game_id: 1,
        response_data: finalAnswers as unknown as Record<string, unknown>[],
        score: totalPoints,
      });
    } catch (_) { /* offline — silently skip */ }
    setSaving(false);
  }

  // Save when results phase starts
  useEffect(() => {
    if (phase === "results") saveResults(answers);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived results data ──────────────────────────────────
  const totalPoints   = answers.reduce((s, a) => s + a.points, 0);
  const correctCount  = answers.filter((a) => a.correct).length;
  const scorePct      = answers.length ? pct(correctCount, answers.length) : 0;
  const passed        = scorePct >= PASSING_SCORE_PCT;
  const gameCardEarned = correctCount >= GAME_CARD_THRESHOLD;

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // ── INTRO ────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="animate-fade-in flex flex-col gap-5">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-20 h-20 rounded-2xl bg-nestle-red-light flex items-center justify-center text-5xl">
            ⚡
          </div>
          <div className="text-center">
            <h2 className="text-[22px] font-bold text-gray-900 mb-1">Rapid-Fire Quiz</h2>
            <p className="text-[13px] text-gray-500">Module 1 · Game 1 of 3</p>
          </div>
        </div>

        {/* Rules card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-100">
          {[
            ["⚡", "12 questions", "Answer as fast as possible for bonus points"],
            ["⏱️", "Time limit per question", "15–25 seconds depending on difficulty"],
            ["🎯", "Speed bonus", "Faster correct answers = more points"],
            ["🃏", "Game Card", `Get ${GAME_CARD_THRESHOLD}/${totalQ} correct to earn a Game Card`],
          ].map(([icon, label, sub]) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xl mt-0.5">{icon}</span>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                <p className="text-[12px] text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={() => setPhase("playing")}
        >
          Start Quiz ▶
        </button>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────
  if (phase === "results") {
    return (
      <div className="animate-fade-in flex flex-col gap-4">
        {/* Score hero */}
        <div
          className={`rounded-2xl p-6 text-center ${
            passed ? "bg-nestle-green-light" : "bg-nestle-red-light"
          }`}
        >
          <div className="text-5xl mb-3">{passed ? "🏆" : "📚"}</div>
          <p className={`text-[13px] font-bold uppercase tracking-wide mb-1 ${passed ? "text-nestle-green" : "text-nestle-red"}`}>
            {passed ? "Passed!" : "Keep Practising"}
          </p>
          <p className="text-[32px] font-black text-gray-900 leading-none mb-1">
            {correctCount}/{totalQ}
          </p>
          <p className="text-[13px] text-gray-500">
            {scorePct}% correct · {totalPoints.toLocaleString()} pts
          </p>
          {gameCardEarned && (
            <div className="mt-3 inline-flex items-center gap-2 bg-nestle-gold-light border border-nestle-gold/30 text-gray-800 rounded-full px-4 py-1.5 text-[12px] font-bold">
              🃏 Game Card Earned!
            </div>
          )}
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Points", totalPoints.toLocaleString(), "text-nestle-blue"],
            ["Accuracy", `${scorePct}%`, passed ? "text-nestle-green" : "text-nestle-red"],
            ["Cards", gameCardEarned ? "1" : "0", "text-nestle-gold"],
          ].map(([label, val, cls]) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-card p-3 text-center">
              <p className={`text-[20px] font-bold ${cls}`}>{val}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Answer review */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Answer Review</p>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {answers.map((ans, i) => {
              const q = QUIZ_QUESTIONS[i];
              const chosen = q.options.find((o) => o.id === ans.selectedId);
              return (
                <li key={ans.questionId} className="px-4 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 text-[14px] shrink-0 ${ans.correct ? "text-nestle-green" : "text-nestle-red"}`}>
                    {ans.correct ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-800 leading-snug">{q.question}</p>
                    {!ans.correct && (
                      <p className="text-[11px] text-nestle-green mt-0.5">
                        ✓ {q.options.find((o) => o.isCorrect)?.text}
                      </p>
                    )}
                    {!ans.correct && chosen && (
                      <p className="text-[11px] text-nestle-red">
                        ✗ {chosen.text}
                      </p>
                    )}
                    {!ans.correct && !chosen && (
                      <p className="text-[11px] text-gray-400 italic">— timed out</p>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-nestle-blue shrink-0">
                    {ans.points > 0 ? `+${ans.points}` : "0"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {saving && (
          <p className="text-center text-[12px] text-gray-400">Saving score…</p>
        )}

        {/* Actions */}
        <button
          className="btn-primary"
          onClick={() => router.push("/modules/1")}
        >
          ← Back to Module 1
        </button>
        <button
          className="w-full py-3 text-[14px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => {
            setAnswers([]);
            setQIndex(0);
            setPhase("intro");
          }}
        >
          Retry Quiz
        </button>
      </div>
    );
  }

  // ── PLAYING / FEEDBACK ───────────────────────────────────
  const lastAnswer = answers[answers.length - 1];

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[12px] text-gray-400 mb-1.5">
            Question {qIndex + 1} of {totalQ}
          </p>
          <ProgressDots total={totalQ} current={qIndex} answers={answers} />
        </div>
        {phase === "playing" && (
          <TimerRing seconds={timeLeft} total={currentQ.timeLimit} />
        )}
        {phase === "feedback" && (
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 text-2xl">
            {lastAnswer?.correct ? "✅" : "❌"}
          </div>
        )}
      </div>

      {/* Running score */}
      <div className="flex items-center justify-between px-4 py-2 bg-nestle-blue-light rounded-xl">
        <span className="text-[12px] font-medium text-nestle-blue">Score</span>
        <span className="text-[14px] font-bold text-nestle-blue">
          {answers.reduce((s, a) => s + a.points, 0).toLocaleString()} pts
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <p className="text-[16px] font-semibold text-gray-900 leading-snug">
          {currentQ.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {currentQ.options.map((opt) => {
          let style =
            "w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-gray-200 bg-white text-[14px] font-medium text-gray-800 transition-all cursor-pointer hover:border-nestle-blue hover:bg-nestle-blue-light";

          if (phase === "feedback") {
            if (opt.isCorrect) {
              style =
                "w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-nestle-green bg-nestle-green-light text-[14px] font-semibold text-nestle-green cursor-default";
            } else if (opt.id === lastAnswer?.selectedId && !lastAnswer?.correct) {
              style =
                "w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-nestle-red bg-nestle-red-light text-[14px] font-medium text-nestle-red cursor-default";
            } else {
              style =
                "w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] border-gray-100 bg-gray-50 text-[14px] text-gray-400 cursor-default";
            }
          }

          return (
            <button
              key={opt.id}
              className={style}
              disabled={phase === "feedback"}
              onClick={() => phase === "playing" && setSelected(opt.id)}
            >
              <span className="inline-block w-6 font-bold uppercase text-[12px] opacity-60 mr-1">
                {opt.id}.
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Feedback panel */}
      {phase === "feedback" && (
        <div
          className={`rounded-xl p-4 ${
            lastAnswer?.correct ? "bg-nestle-green-light border border-nestle-green/20" : "bg-nestle-red-light border border-nestle-red/20"
          }`}
        >
          <p className={`text-[13px] font-bold mb-1 ${lastAnswer?.correct ? "text-nestle-green" : "text-nestle-red"}`}>
            {lastAnswer?.correct
              ? `✓ Correct! +${lastAnswer.points} pts`
              : lastAnswer?.selectedId
              ? "✗ Incorrect"
              : "⏱ Time's up!"}
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            {currentQ.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {phase === "feedback" && (
        <button className="btn-primary" onClick={nextQuestion}>
          {qIndex + 1 < totalQ ? "Next Question →" : "See Results →"}
        </button>
      )}
    </div>
  );
}
