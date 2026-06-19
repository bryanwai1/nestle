// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const LETTERS = ["P", "A", "S", "S"];
const ANSWERS = ["pull", "aim", "squeeze", "sweep"];
const TIME_LIMIT = 120;

type Phase = "intro" | "playing" | "results";

export default function PassTypedClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [values, setValues] = useState<string[]>(["", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function start() {
    setPhase("playing");
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { stopTimer(); submit(); return 0; } return t - 1; });
    }, 1000);
  }

  function updateValue(i: number, v: string) {
    setValues(prev => { const next = [...prev]; next[i] = v; return next; });
  }

  function submit() {
    stopTimer();
    setSubmitted(true);
    setPhase("results");
  }

  useEffect(() => () => stopTimer(), []);

  const normalized = values.map(v => v.trim().toLowerCase());
  const correctFlags = normalized.map((v, i) => v === ANSWERS[i]);
  const allCorrect = correctFlags.every(Boolean);
  const correctCount = correctFlags.filter(Boolean).length;
  const totalPts = allCorrect ? 300 : 0; // 100% required, no partial credit per official spec

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id: teamId, module_id: 3, game_id: 1, points: totalPts, time_seconds: TIME_LIMIT - timeLeft, game_cards: allCorrect ? 1 : 0 });
      } catch (_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex gap-2">
          {LETTERS.map((l, i) => (
            <div key={i} className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white text-[20px] font-black">{l}</div>
          ))}
        </div>
        <h2 className="text-[22px] font-bold text-gray-900">PASS Technique Exam</h2>
        <p className="text-[13px] text-gray-500">Module 3 . Game 1 of 2</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["Format", "Type the full word for each letter", "P-A-S-S stands for a 4-step extinguisher technique"],
          ["Accuracy", "100% correct required", "All 4 words must be spelled correctly and in the right order"],
          ["Time", "2-minute timer", "Submit before time runs out"],
          ["Attempts", "One submission only", "No retries, no hints"],
        ].map(([i, l, s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam conditions</p>
        <p className="text-[12px] text-red-600 mt-0.5">No word bank or autocomplete is provided. Recall the technique from memory.</p>
      </div>
      <button className="btn-primary" onClick={start}>Start Exam</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${allCorrect ? "bg-green-50" : "bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${allCorrect ? "text-green-700" : "text-red-600"}`}>{allCorrect ? "Fully Correct!" : "Not Fully Correct"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/4</p>
        <p className="text-[13px] text-gray-500">{totalPts} pts {!allCorrect && "(100% accuracy required for points)"}</p>
        {allCorrect && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Your Answers</p></div>
        {LETTERS.map((l, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[15px] shrink-0 ${correctFlags[i] ? "bg-green-500" : "bg-red-500"}`}>{l}</div>
            <div className="flex-1">
              <p className="text-[13px] text-gray-800">You typed: <span className="font-semibold">{values[i] || "(blank)"}</span></p>
              {!correctFlags[i] && <p className="text-[12px] text-green-600">Correct word: {ANSWERS[i].charAt(0).toUpperCase() + ANSWERS[i].slice(1)}</p>}
            </div>
            <span className="text-[14px] font-bold shrink-0">{correctFlags[i] ? "+" : "-"}</span>
          </div>
        ))}
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/3")}>Back to Module 3</button>
    </div>
  );

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">Type the full word for each letter of the acronym</p>
        <div className={`text-[16px] font-black ${timeLeft <= 20 ? "text-red-500" : "text-blue-700"}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct > 30 ? "bg-blue-500" : "bg-red-500"}`} style={{ width: `${timerPct}%` }} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[13px] text-gray-600 mb-4">A fire breaks out near you. Recall the 4-step extinguisher technique and type the missing word for each letter.</p>
        <div className="flex flex-col gap-3">
          {LETTERS.map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-[18px] shrink-0">{l}</div>
              <input
                type="text"
                value={values[i]}
                onChange={e => updateValue(i, e.target.value)}
                placeholder={`Type the word for "${l}"...`}
                className="flex-1 border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={submit}>Submit Final Answer</button>
    </div>
  );
}
