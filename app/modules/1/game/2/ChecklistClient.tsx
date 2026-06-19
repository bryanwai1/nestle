// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCENARIOS, POINTS_PER_CORRECT, SPEED_BONUS, GAME_CARD_THRESHOLD, TIME_LIMIT, type CheckItem } from "./checklist-data";
import { useTeam } from "@/lib/useTeam";

type Phase = "intro"|"playing"|"review"|"results";
interface ItemAnswer { id: string; userPass: boolean; correct: boolean; timeUsed: number; points: number; }
interface ScenarioResult { scenarioId: number; answers: ItemAnswer[]; }

function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100;
  const color = pct > 50 ? "bg-green-500" : pct > 25 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ChecklistClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sIdx, setSIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<ItemAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [saving, setSaving] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(0);

  const scenario = SCENARIOS[sIdx];
  const item: CheckItem = scenario.items[itemIdx];
  const totalItems = SCENARIOS.reduce((s, sc) => s + sc.items.length, 0);
  const allAnswers = results.flatMap(r => r.answers);
  const totalCorrect = allAnswers.filter(a => a.correct).length;
  const totalPts = allAnswers.reduce((s, a) => s + a.points, 0);
  const passed = totalCorrect >= GAME_CARD_THRESHOLD;

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(TIME_LIMIT);
    setTimedOut(false);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopTimer();
          setTimedOut(true);
          handleAnswer(item.pass); // auto-pass on timeout (penalty: no speed bonus)
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, sIdx, itemIdx]); // eslint-disable-line

  function handleAnswer(userPass: boolean) {
    stopTimer();
    const used = Math.min(TIME_LIMIT, Math.round((Date.now() - startRef.current) / 1000));
    const correct = userPass === item.pass;
    const speedBonus = correct ? Math.round(SPEED_BONUS * Math.max(0, 1 - used / TIME_LIMIT)) : 0;
    const pts = correct ? POINTS_PER_CORRECT + speedBonus : 0;
    const newAns: ItemAnswer = { id: item.id, userPass, correct, timeUsed: used, points: pts };
    const updated = [...currentAnswers, newAns];
    setCurrentAnswers(updated);

    // Last item in scenario?
    if (itemIdx + 1 >= scenario.items.length) {
      setResults(prev => [...prev, { scenarioId: scenario.id, answers: updated }]);
      setPhase("review");
    } else {
      setItemIdx(i => i + 1);
    }
  }

  function nextScenario() {
    if (sIdx + 1 < SCENARIOS.length) {
      setSIdx(s => s + 1);
      setItemIdx(0);
      setCurrentAnswers([]);
      setPhase("playing");
    } else {
      setPhase("results");
    }
  }

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id: teamId, module_id: 1, game_id: 2, points: totalPts, time_seconds: allAnswers.reduce((s,a) => s+a.timeUsed, 0), game_cards: passed ? 1 : 0 });
      } catch (_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  // ── INTRO ──
  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-5xl">🔧</div>
        <h2 className="text-[22px] font-bold text-gray-900">Car Checklist Validator</h2>
        <p className="text-[13px] text-gray-500">Module 1 · Game 2 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["🚗","3 inspection scenarios","Each with 5 safety items to assess"],["✅","Pass or Fail","Read the description and judge each item"],["⏱️",`${TIME_LIMIT}s per item`,"Speed bonus for fast correct answers"],["🃏","Game Card",`${GAME_CARD_THRESHOLD}/${totalItems} correct to earn one`]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <span className="text-xl mt-0.5">{i}</span>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => { setPhase("playing"); }}>Start Inspection ▶</button>
    </div>
  );

  // ── REVIEW ──
  if (phase === "review") {
    const sr = results[results.length - 1];
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scenario {scenario.id} Results</p>
            <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{scenario.title}</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {scenario.items.map((it, i) => {
              const ans = sr.answers[i];
              const ok = ans?.correct;
              return (
                <li key={it.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-xl shrink-0">{it.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-gray-900">{it.label}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${it.pass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {it.pass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{it.failHint}</p>
                    {!ok && <p className="text-[11px] text-red-500 mt-0.5">You answered: {ans?.userPass ? "Pass ✓" : "Fail ✗"}</p>}
                  </div>
                  <span className={`text-[20px] shrink-0 ${ok ? "" : "grayscale opacity-40"}`}>{ok ? "✅" : "❌"}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
          <span className="text-[13px] font-medium text-blue-700">Running Total</span>
          <span className="text-[15px] font-bold text-blue-700">{[...allAnswers, ...sr.answers].filter(a=>a.correct).length} correct · {[...allAnswers].reduce((s,a)=>s+a.points,0) + sr.answers.reduce((s,a)=>s+a.points,0)} pts</span>
        </div>
        <button className="btn-primary" onClick={nextScenario}>
          {sIdx + 1 < SCENARIOS.length ? `Next Scenario (${sIdx + 2}/${SCENARIOS.length}) →` : "See Final Results →"}
        </button>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed ? "bg-green-50" : "bg-red-50"}`}>
        <div className="text-5xl mb-3">{passed ? "🏆" : "📋"}</div>
        <p className={`text-[13px] font-bold uppercase tracking-wide mb-1 ${passed ? "text-green-700" : "text-red-600"}`}>{passed ? "Certified Inspector!" : "Keep Practising"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{totalCorrect}/{totalItems}</p>
        <p className="text-[13px] text-gray-500">{Math.round(totalCorrect/totalItems*100)}% correct · {totalPts.toLocaleString()} pts</p>
        {passed && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">🃏 Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points", totalPts.toLocaleString(), "text-blue-700"],["Correct", `${totalCorrect}/${totalItems}`, passed?"text-green-700":"text-red-600"],["Card", passed?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Key Learning</p>
        <p className="text-[13px] text-gray-700 leading-relaxed">Always check <span className="font-semibold text-gray-900">Brake · Lighting · Wipers · Horn · Side Mirrors</span> before every journey. Never drive with a known defect — report it immediately.</p>
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving…</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/1")}>← Back to Module 1</button>
      
    </div>
  );

  // ── PLAYING ──
  const doneInScenario = currentAnswers.length;
  const totalDone = results.flatMap(r => r.answers).length + doneInScenario;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-[12px] text-gray-400">
        <span>Scenario {sIdx + 1}/{SCENARIOS.length} · Item {itemIdx + 1}/{scenario.items.length}</span>
        <span className="font-semibold text-blue-700">{totalPts} pts</span>
      </div>
      <div className="flex gap-1">
        {SCENARIOS.map((sc, si) => sc.items.map((it, ii) => {
          const flat = si * sc.items.length + ii;
          const ans = allAnswers[flat] ?? currentAnswers[ii - (si === sIdx ? 0 : scenario.items.length)];
          const isCurrent = si === sIdx && ii === itemIdx;
          let bg = "bg-gray-200";
          if (isCurrent) bg = "bg-blue-500";
          else if (si < sIdx || (si === sIdx && ii < itemIdx)) bg = ans?.correct ? "bg-green-500" : "bg-red-500";
          return <div key={`${si}-${ii}`} className={`flex-1 h-1.5 rounded-full ${bg} transition-colors`} />;
        }))}
      </div>

      {/* Timer */}
      <TimerBar seconds={timeLeft} total={TIME_LIMIT} />
      <div className="flex justify-between text-[11px] text-gray-400">
        <span>Time remaining</span>
        <span className={timeLeft <= 5 ? "text-red-500 font-bold" : ""}>{timeLeft}s</span>
      </div>

      {/* Scenario context */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-0.5">{scenario.title}</p>
        <p className="text-[12px] text-blue-800 leading-relaxed">{scenario.context}</p>
      </div>

      {/* Item card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100">{item.icon}</div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Check Item {itemIdx + 1} of {scenario.items.length}</p>
            <p className="text-[16px] font-bold text-gray-900">{item.label}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[14px] text-gray-700 leading-relaxed italic">"{item.description}"</p>
        </div>
      </div>

      {/* Pass / Fail buttons */}
      <p className="text-center text-[12px] text-gray-400 font-medium">Does this item PASS or FAIL inspection?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          className="py-5 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-[16px] hover:bg-green-100 hover:border-green-400 transition-all active:scale-95"
          onClick={() => handleAnswer(true)}
        >
          ✓ PASS
        </button>
        <button
          className="py-5 rounded-2xl border-2 border-red-300 bg-red-50 text-red-600 font-bold text-[16px] hover:bg-red-100 hover:border-red-400 transition-all active:scale-95"
          onClick={() => handleAnswer(false)}
        >
          ✗ FAIL
        </button>
      </div>
      {timedOut && <p className="text-center text-[12px] text-red-400">⏱ Time's up — moving on</p>}
    </div>
  );
}
