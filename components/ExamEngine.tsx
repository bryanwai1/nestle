"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

export interface ExamOption { id: string; text: string; isCorrect: boolean; }
export interface ExamQuestion { id: number; question: string; image?: boolean; imageCaption?: string; options: ExamOption[]; }
export interface ExamConfig {
  moduleId: number;
  gameId: number;
  title: string;
  subtitle: string;
  icon: string;
  totalTimeSeconds: number;
  pointsCorrect: number;
  pointsWrong: number;
  passPct: number;
  teamId?: string;
}

interface Answer { questionId: number; selectedId: string | null; correct: boolean; }

/* ── Single question view — remounted fresh via key={qIndex} in the parent.
   This guarantees zero state carryover between questions: no "selected"
   value from question N can ever appear pre-ticked on question N+1. ── */
function QuestionView({
  q, locked, onSelect,
}: { q: ExamQuestion; locked: boolean; onSelect: (id: string) => void }) {
  const [tempSelected, setTempSelected] = useState<string | null>(null);

  function handleClick(id: string) {
    if (locked || tempSelected) return;
    setTempSelected(id);
    onSelect(id);
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {q.image && (
          <div className="mb-3 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 h-40 flex flex-col items-center justify-center gap-1">
            <span className="text-[11px] font-bold text-gray-400 tracking-wide">[ PHOTO PLACEHOLDER ]</span>
            <p className="text-[11px] text-gray-400 px-4 text-center">{q.imageCaption || "Photo to be added"}</p>
          </div>
        )}
        <p className="text-[15px] font-semibold text-gray-900 leading-snug">{q.question}</p>
      </div>
      <div className="flex flex-col gap-2">
        {q.options.map(opt => {
          const isSel = tempSelected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleClick(opt.id)}
              disabled={locked || !!tempSelected}
              className={`w-full text-left px-4 py-3 rounded-xl border-[1.5px] text-[13.5px] font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
                isSel
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <span className="inline-block w-5 font-bold text-[11px] text-gray-400 mr-1.5">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ExamEngine({ config, questions }: { config: ExamConfig; questions: ExamQuestion[] }) {
  const router = useRouter();
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || config.teamId || "3";
  const [phase, setPhase] = useState<"intro" | "playing" | "results">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.totalTimeSeconds);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = questions.length;
  const q = questions[qIndex];

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function finish(finalAnswers: Answer[]) {
    stopTimer();
    setAnswers(finalAnswers);
    setPhase("results");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopTimer();
          setAnswers(prev => {
            const filled = [...prev];
            for (let i = filled.length; i < total; i++) {
              filled.push({ questionId: questions[i].id, selectedId: null, correct: false });
            }
            finish(filled);
            return filled;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase]); // eslint-disable-line

  function selectOption(optId: string) {
    if (locked || phase !== "playing") return;
    setLocked(true);
    const correct = !!q.options.find(o => o.id === optId)?.isCorrect;
    const newAnswers = [...answers, { questionId: q.id, selectedId: optId, correct }];
    setTimeout(() => {
      setLocked(false);
      if (qIndex + 1 < total) {
        setAnswers(newAnswers);
        setQIndex(i => i + 1);
      } else {
        finish(newAnswers);
      }
    }, 350);
  }

  const correctCount = answers.filter(a => a.correct).length;
  const wrongCount = answers.length - correctCount;
  const totalPts = Math.max(0, correctCount * config.pointsCorrect - wrongCount * Math.abs(config.pointsWrong));
  const pct = total ? Math.round((correctCount / total) * 100) : 0;
  const passed = pct >= config.passPct;

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try {
        await sb.from("scores").upsert({
          team_id: teamId, module_id: config.moduleId, game_id: config.gameId,
          points: totalPts, time_seconds: config.totalTimeSeconds - timeLeft, game_cards: passed ? 1 : 0,
        });
      } catch (_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-2xl font-black text-red-600">{config.icon}</div>
        <h2 className="text-[22px] font-bold text-gray-900">{config.title}</h2>
        <p className="text-[13px] text-gray-500">{config.subtitle}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1", `${total} questions, 6 choices each`, "Only one answer is correct per question"],
          ["2", `${Math.floor(config.totalTimeSeconds/60)} minute overall timer`, "One timer for the whole card, not per question"],
          ["3", `+${config.pointsCorrect} correct / -${Math.abs(config.pointsWrong)} wrong`, "Wrong answers deduct points from your total"],
          ["4", "No feedback until the end", "You will not be told right or wrong until you finish"],
        ].map(([i, l, s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-[11px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam conditions - one attempt only</p>
        <p className="text-[12px] text-red-600 mt-0.5">No hints. No retries. Choose carefully.</p>
      </div>
      <button className="btn-primary" onClick={() => { setPhase("playing"); setTimeLeft(config.totalTimeSeconds); setQIndex(0); setAnswers([]); }}>Begin Exam</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed ? "bg-green-50" : "bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${passed ? "text-green-700" : "text-red-600"}`}>{passed ? "Passed" : "Below Passing Score"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/{total}</p>
        <p className="text-[13px] text-gray-500">{pct}% correct . {totalPts} pts ({correctCount} right, {wrongCount} wrong)</p>
        {passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Answer Review</p></div>
        <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {answers.map((a, i) => {
            const qq = questions[i];
            const chosen = qq.options.find(o => o.id === a.selectedId);
            const correctOpt = qq.options.find(o => o.isCorrect);
            return (
              <li key={qq.id} className="px-4 py-3 flex items-start gap-3">
                <span className={`mt-0.5 text-[13px] font-bold shrink-0 ${a.correct ? "text-green-600" : "text-red-500"}`}>{a.correct ? "+" : "-"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-800 leading-snug">{qq.question}</p>
                  {!a.correct && <p className="text-[11px] text-green-600 mt-0.5">Correct: {correctOpt?.text}</p>}
                  {!a.correct && chosen && <p className="text-[11px] text-red-500">You chose: {chosen.text}</p>}
                  {!a.correct && !chosen && <p className="text-[11px] text-gray-400 italic">Not answered (time expired)</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push(`/modules/${config.moduleId}`)}>Back to Module {config.moduleId}</button>
    </div>
  );

  const timerPct = (timeLeft / config.totalTimeSeconds) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Question {qIndex + 1} of {total}</p>
        <div className={`text-[16px] font-black ${timeLeft <= 30 ? "text-red-500" : "text-blue-700"}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct > 30 ? "bg-blue-500" : "bg-red-500"}`} style={{ width: `${timerPct}%` }} />
      </div>
      <div className="flex gap-1">
        {questions.map((_, i) => {
          const bg = i < qIndex ? "bg-blue-400" : i === qIndex ? "bg-blue-600" : "bg-gray-200";
          return <div key={i} className={`flex-1 h-1.5 rounded-full ${bg}`} />;
        })}
      </div>
      <QuestionView key={qIndex} q={q} locked={locked} onSelect={selectOption} />
    </div>
  );
}
