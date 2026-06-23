// @ts-nocheck
// components/admin/AnswerKeyEditor.tsx
//
// Lets a facilitator edit the accepted keywords for every auto-graded
// keyword question, without touching code. Saving writes the new key to
// question_answer_keys and immediately calls regrade_question() so answers
// already submitted are re-scored against the new wording.
//
// Two shapes are edited here:
//   subjective_select -> { minCorrect, groups: string[][] }
//       each "group" is a set of words/phrases; matching ANY one of them
//       credits that answer slot (e.g. "ecg" OR "ekg" OR "electrocardiogram").
//   video_identify / video_avoid -> { acceptedKeywords: string[] }
//       a flat list; matching any one marks the clip answer correct.

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SubjKey = { minCorrect: number; groups: string[][] };
type VideoKey = { acceptedKeywords: string[] };
type Row = { question_id: string; response_type: string; answer_key: SubjKey | VideoKey };

// Friendly names so the admin isn't staring at "q14".
const LABELS: Record<string, string> = {
  q6: 'Module 1 · Driver fatigue — spot it',
  q7: 'Module 1 · Driver fatigue — what to do',
  q8: 'Module 1 · No seatbelt — spot it',
  q9: 'Module 1 · Seatbelt — what to do',
  q10: 'Module 1 · Distracted driving — spot it',
  q11: 'Module 1 · Distracted driving — what to do',
  q12: 'Module 1 · Reckless driving — spot it',
  q13: 'Module 1 · Reckless driving — what to do',
  q14: 'Module 1 · Mirror / signal — spot it',
  q15: 'Module 1 · Mirror / signal — what to do',
  q21: 'Module 3 · Name 4 heart-health tests',
  q31: 'Module 10 · Name the 7 types of plastic',
};

const ORDER = ['q21', 'q31', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'];

function splitList(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

export function AnswerKeyEditor() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('question_answer_keys')
      .select('question_id,response_type,answer_key')
      .in('response_type', ['subjective_select', 'video_identify', 'video_avoid']);
    const sorted = ((data ?? []) as Row[]).sort(
      (a, b) => (ORDER.indexOf(a.question_id) + 999) - (ORDER.indexOf(b.question_id) + 999)
    );
    setRows(sorted);
    setLoading(false);
  }

  function patch(id: string, key: SubjKey | VideoKey) {
    setRows((rs) => rs.map((r) => (r.question_id === id ? { ...r, answer_key: key } : r)));
  }

  async function save(row: Row) {
    setSavingId(row.question_id);
    setMsg((m) => ({ ...m, [row.question_id]: '' }));
    const { error } = await supabase
      .from('question_answer_keys')
      .update({ answer_key: row.answer_key })
      .eq('question_id', row.question_id);

    let regraded = 0;
    if (!error) {
      const { data } = await supabase.rpc('regrade_question', { p_question_id: row.question_id });
      regraded = (data as number) ?? 0;
    }
    setSavingId(null);
    setMsg((m) => ({
      ...m,
      [row.question_id]: error ? `⚠ ${error.message}` : `✓ Saved · re-graded ${regraded} answer(s)`,
    }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-200" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
        No editable answer keys found. Make sure you’re signed in as a facilitator and that migrations 0005 + 0006 have been run.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row) => {
        const isSubjective = row.response_type === 'subjective_select';
        return (
          <div key={row.question_id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">{LABELS[row.question_id] ?? row.question_id}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {row.question_id} · {row.response_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => save(row)}
                disabled={savingId === row.question_id}
                className="rounded-lg bg-[#E4002B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#c40025] disabled:opacity-50"
              >
                {savingId === row.question_id ? 'Saving…' : 'Save & re-grade'}
              </button>
            </div>

            {isSubjective ? (
              <SubjectiveEditor
                value={row.answer_key as SubjKey}
                onChange={(k) => patch(row.question_id, k)}
              />
            ) : (
              <VideoEditor
                value={row.answer_key as VideoKey}
                onChange={(k) => patch(row.question_id, k)}
              />
            )}

            {msg[row.question_id] && (
              <p className={`mt-3 text-xs ${msg[row.question_id].startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {msg[row.question_id]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubjectiveEditor({ value, onChange }: { value: SubjKey; onChange: (k: SubjKey) => void }) {
  const groups = value.groups ?? [];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Answers required for full marks:</span>
        <input
          type="number"
          min={1}
          value={value.minCorrect}
          onChange={(e) => onChange({ ...value, minCorrect: Math.max(1, Number(e.target.value) || 1) })}
          className="w-16 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-center text-slate-100"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        One row per accepted answer. Within a row, list any words/phrases that should count — separate them with commas.
      </p>

      {groups.map((grp, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-right text-xs text-slate-500">{i + 1}.</span>
          <input
            type="text"
            value={grp.join(', ')}
            onChange={(e) => {
              const next = [...groups];
              next[i] = splitList(e.target.value);
              onChange({ ...value, groups: next });
            }}
            placeholder="e.g. ecg, ekg, electrocardiogram"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onChange({ ...value, groups: groups.filter((_, idx) => idx !== i) })}
            className="text-xs text-slate-500 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...value, groups: [...groups, []] })}
        className="text-xs font-medium text-slate-400 underline hover:text-slate-200"
      >
        + Add accepted answer
      </button>
    </div>
  );
}

function VideoEditor({ value, onChange }: { value: VideoKey; onChange: (k: VideoKey) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">
        Any one of these words/phrases (comma-separated) marks the clip answer correct.
      </p>
      <textarea
        rows={3}
        value={(value.acceptedKeywords ?? []).join(', ')}
        onChange={(e) => onChange({ acceptedKeywords: splitList(e.target.value) })}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
      />
    </div>
  );
}
