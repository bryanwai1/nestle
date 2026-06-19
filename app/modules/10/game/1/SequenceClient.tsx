// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

interface Step { id: string; label: string; isDecoy: boolean; }

const CORRECT_ORDER = ["danger", "response", "send", "airway", "breathing", "compress"];

const ALL_STEPS: Record<string, Step> = {
  danger:    { id:"danger",    label:"Check the surrounding area for danger before approaching", isDecoy:false },
  response:  { id:"response",  label:"Check for a response - tap shoulders and shout",            isDecoy:false },
  send:      { id:"send",      label:"Send someone to call for emergency help",                   isDecoy:false },
  airway:    { id:"airway",    label:"Open and check the airway for obstruction",                 isDecoy:false },
  breathing: { id:"breathing", label:"Look, listen, and feel for normal breathing",                isDecoy:false },
  compress:  { id:"compress",  label:"Begin chest compressions immediately",                       isDecoy:false },
  pulse:     { id:"pulse",     label:"Check for a pulse at the wrist before taking any other action", isDecoy:true },
  wait:      { id:"wait",      label:"Loosen the casualty's clothing and wait quietly for paramedics", isDecoy:true },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const TIME_LIMIT = 90;
const PTS_CORRECT = 10;
const PTS_WRONG = -5;

type Phase = "intro" | "playing" | "results";

export default function SequenceClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [pool, setPool] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>(Array(6).fill(null));
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function start() {
    const order = shuffle(Object.keys(ALL_STEPS));
    setPool(order);
    setSlots(Array(6).fill(null));
    setTimeLeft(TIME_LIMIT);
    setPhase("playing");
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { stopTimer(); submit(); return 0; } return t - 1; });
    }, 1000);
  }

  function placeTile(id: string) {
    const nextEmpty = slots.findIndex(s => s === null);
    if (nextEmpty === -1) return;
    setSlots(prev => { const next = [...prev]; next[nextEmpty] = id; return next; });
    setPool(prev => prev.filter(x => x !== id));
  }

  function removeSlot(i: number) {
    const id = slots[i];
    if (!id) return;
    setSlots(prev => { const next = [...prev]; next[i] = null; return next; });
    setPool(prev => [...prev, id]);
  }

  function submit() {
    stopTimer();
    setPhase("results");
  }

  useEffect(() => () => stopTimer(), []);

  const correctCount = slots.filter((id, i) => id === CORRECT_ORDER[i]).length;
  const wrongCount = 6 - correctCount;
  const totalPts = Math.max(0, correctCount * PTS_CORRECT - wrongCount * Math.abs(PTS_WRONG));
  const allCorrect = correctCount === 6;
  const allFilled = slots.every(s => s !== null);

  useEffect(() => {
    if (phase !== "results") return;
    const save = async () => {
      const sb = createClient(); if (!sb) return;
      setSaving(true);
      try {
        // @ts-ignore
      await sb.from("scores").upsert({ team_id: teamId, module_id: 10, game_id: 1, points: totalPts, time_seconds: TIME_LIMIT - timeLeft, game_cards: allCorrect ? 1 : 0 });
      } catch (_) {}
      setSaving(false);
    };
    save();
  }, [phase]); // eslint-disable-line

  if (phase === "intro") return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-2xl font-black text-red-600">6</div>
        <h2 className="text-[22px] font-bold text-gray-900">CPR Sequence Exam</h2>
        <p className="text-[13px] text-gray-500">Module 10 . Game 1 of 4</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[
          ["1", "8 action cards, only 6 belong", "Two cards are not part of the correct CPR sequence - leave them out"],
          ["2", "Fill all 6 slots in order", "Tap a card to place it in the next empty slot"],
          ["3", "+10 correct slot / -5 wrong slot", "Scored by exact position, not just inclusion"],
          ["4", "90-second timer, one attempt", "No feedback until you submit"],
        ].map(([i, l, s]) => (
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-black text-[10px] flex items-center justify-center shrink-0">{i}</div>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">Exam - no hints provided</p>
        <p className="text-[12px] text-red-600 mt-0.5">Some cards sound plausible but are not part of the correct first-response sequence.</p>
      </div>
      <button className="btn-primary" onClick={start}>Start Exam</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${allCorrect ? "bg-green-50" : "bg-red-50"}`}>
        <p className={`text-[14px] font-bold uppercase tracking-wide mb-1 ${allCorrect ? "text-green-700" : "text-red-600"}`}>{allCorrect ? "Perfect Sequence!" : "Not Fully Correct"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{correctCount}/6</p>
        <p className="text-[13px] text-gray-500">{totalPts} pts</p>
        {allCorrect && <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">Game Card Earned!</div>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Correct Sequence</p></div>
        {CORRECT_ORDER.map((id, i) => {
          const step = ALL_STEPS[id];
          const placed = slots[i];
          const ok = placed === id;
          return (
            <div key={id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${ok ? "" : "bg-red-50"}`}>
              <div className="w-7 h-7 rounded-full bg-red-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900">{step.label}</p>
                {!ok && <p className="text-[11px] text-red-500 mt-0.5">You placed: {placed ? ALL_STEPS[placed].label : "(empty)"}</p>}
              </div>
              <span className="text-[14px] font-bold shrink-0">{ok ? "+" : "-"}</span>
            </div>
          );
        })}
      </div>
      {saving && <p className="text-center text-[12px] text-gray-400">Saving...</p>}
      <button className="btn-primary" onClick={() => router.push("/modules/10")}>Back to Module 10</button>
    </div>
  );

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">{6 - slots.filter(s=>s).length} of 6 slots remaining</p>
        <div className={`text-[18px] font-black ${timeLeft <= 20 ? "text-red-500" : "text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct > 30 ? "bg-blue-500" : "bg-red-500"}`} style={{ width: `${timerPct}%` }} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Your Sequence</p>
        <div className="flex flex-col gap-2">
          {slots.map((id, i) => (
            <button key={i} onClick={() => removeSlot(i)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${id ? "border-blue-300 bg-blue-50" : "border-dashed border-gray-200 bg-gray-50"}`}>
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
              {id ? <p className="text-[13px] font-semibold text-blue-800">{ALL_STEPS[id].label}</p> : <p className="text-[12px] text-gray-400 italic">Tap a card below</p>}
            </button>
          ))}
        </div>
      </div>
      {pool.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Available Cards</p>
          <div className="flex flex-col gap-2">
            {pool.map(id => (
              <button key={id} onClick={() => placeTile(id)}
                className="text-left px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-[13px] font-medium text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all">
                {ALL_STEPS[id].label}
              </button>
            ))}
          </div>
        </div>
      )}
      {allFilled && <button className="btn-primary" onClick={submit}>Submit Final Sequence</button>}
    </div>
  );
}
