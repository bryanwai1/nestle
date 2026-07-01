// @ts-nocheck
// components/admin/TeamAnswersBoard.tsx
//
// Per-team answer board. Loads EVERY game_response (graded + ungraded) and
// groups by team, so an answer can never disappear once it's graded — it
// just changes status. Click a team on the left to see only that team's
// answers. Realtime keeps it live with a unique channel name.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QUESTIONS } from '@/lib/game/questions';

interface Resp {
  id: string;
  team_id: string;
  module_id: string;
  question_id: string;
  response_type: string;
  response_data: Record<string, unknown> | null;
  media_url: string | null;
  text_response: string | null;
  is_correct: boolean | null;
  points_awarded: number;
  auto_graded: boolean;
  created_at: string;
  teams: {
    team_number: number;
    member_1_name: string;
    member_2_name: string;
    member_3_name: string;
  } | null;
}

const CORRECT_PTS = 10;
const WRONG_PTS = -5;

function publicMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  try {
    const supabase = createClient();
    return supabase.storage.from('submissions').getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|avif)$/i.test(url);
}
function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)$/i.test(url);
}

// Friendly per-step label (e.g. "C – Call for help") for multi-photo answers.
function stepLabelFor(questionId: string, stepId: string): string {
  const q = QUESTIONS[questionId];
  const steps = q && q.photoSteps;
  if (steps) {
    const s = steps.find((x) => x.id === stepId);
    if (s) return s.label.en;
  }
  return stepId;
}

export function TeamAnswersBoard() {
  const [rows, setRows] = useState<Resp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [onlyUngraded, setOnlyUngraded] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from('game_responses')
        .select(
          '*, teams(team_number,member_1_name,member_2_name,member_3_name)'
        )
        .order('created_at', { ascending: true });
      if (!cancelled) {
        setRows((data as unknown as Resp[]) ?? []);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel('team-answers-' + Math.random().toString(36).slice(2))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_responses' },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const teams = useMemo(() => {
    const m = new Map<
      string,
      { team_id: string; team_number: number; count: number; graded: number }
    >();
    rows.forEach((r) => {
      if (!m.has(r.team_id)) {
        m.set(r.team_id, {
          team_id: r.team_id,
          team_number: r.teams?.team_number ?? 0,
          count: 0,
          graded: 0,
        });
      }
      const e = m.get(r.team_id)!;
      e.count++;
      if (r.is_correct !== null) e.graded++;
    });
    return Array.from(m.values()).sort((a, b) => a.team_number - b.team_number);
  }, [rows]);

  useEffect(() => {
    if (!selected && teams.length) setSelected(teams[0].team_id);
  }, [teams, selected]);

  const visible = rows
    .filter((r) => r.team_id === selected)
    .filter((r) => (onlyUngraded ? r.is_correct === null : true));

  async function grade(r: Resp, correct: boolean, points: number) {
    setBusy(r.id);
    const supabase = createClient();
    await supabase
      .from('game_responses')
      .update({
        is_correct: correct,
        points_awarded: points,
        evaluated_at: new Date().toISOString(),
      })
      .eq('id', r.id);
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
        Loading answers…
      </div>
    );
  }

  if (!teams.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
        No answers submitted yet. They'll appear here live as teams play.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      {/* Team rail */}
      <aside className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Teams · {teams.length}
        </div>
        <div className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
          {teams.map((t) => {
            const active = t.team_id === selected;
            const pending = t.count - t.graded;
            return (
              <button
                key={t.team_id}
                onClick={() => setSelected(t.team_id)}
                className={
                  'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ' +
                  (active
                    ? 'bg-gradient-to-r from-[#E4002B]/30 to-[#E4002B]/5 ring-1 ring-[#E4002B]/50'
                    : 'hover:bg-white/5')
                }
              >
                <span
                  className={
                    'text-sm font-semibold ' +
                    (active ? 'text-white' : 'text-slate-200')
                  }
                >
                  Team {t.team_number}
                </span>
                <span className="flex items-center gap-1.5">
                  {pending > 0 && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {pending} new
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {t.graded}/{t.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Answers */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            {selected
              ? 'Team ' +
                (teams.find((t) => t.team_id === selected)?.team_number ?? '') +
                ' · ' +
                visible.length +
                ' answer' +
                (visible.length === 1 ? '' : 's')
              : 'Select a team'}
          </h3>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={onlyUngraded}
              onChange={(e) => setOnlyUngraded(e.target.checked)}
              className="accent-[#E4002B]"
            />
            Needs grading only
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            {onlyUngraded
              ? 'Everything for this team is graded. 🎉'
              : 'No answers from this team yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visible.map((r) => {
              const url = publicMediaUrl(r.media_url);
              const graded = r.is_correct !== null;
              // three-state: full correct / partial (positive but not full) / wrong
              const status = !graded
                ? 'ungraded'
                : r.is_correct
                ? 'correct'
                : r.points_awarded > 0
                ? 'partial'
                : 'wrong';
              const photos =
                r.response_data && Array.isArray((r.response_data as any).photos)
                  ? ((r.response_data as any).photos as Array<{ stepId: string; url: string }>)
                  : null;
              const border =
                status === 'correct'
                  ? 'border-emerald-400/30 bg-emerald-400/5'
                  : status === 'partial'
                  ? 'border-amber-400/30 bg-amber-400/5'
                  : status === 'wrong'
                  ? 'border-rose-400/30 bg-rose-400/5'
                  : 'border-white/10 bg-black/20';
              return (
                <div key={r.id} className={'rounded-xl border p-3 transition ' + border}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-300">
                      {r.module_id.replace(/^module-\d+-/, '').replace(/-/g, ' ')} ·{' '}
                      {r.question_id.toUpperCase()}
                    </span>
                    {status === 'ungraded' ? (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        Ungraded
                      </span>
                    ) : (
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                          (status === 'correct'
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : status === 'partial'
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-rose-400/20 text-rose-300')
                        }
                      >
                        {status === 'correct' ? 'Correct' : status === 'partial' ? 'Partial' : 'Wrong'} ·{' '}
                        {r.points_awarded > 0 ? '+' : ''}
                        {r.points_awarded}
                        {r.auto_graded ? ' · auto' : ''}
                      </span>
                    )}
                  </div>

                  {/* Answer content */}
                  <div className="mb-3 min-h-[40px] text-sm text-slate-100">
                    {r.text_response && <p className="mb-2">{r.text_response}</p>}

                    {/* Multi-photo (e.g. Q29 C-A-L-M): one labelled photo per step */}
                    {photos && photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {photos.map((p) => {
                          const purl = publicMediaUrl(p.url);
                          return (
                            <figure key={p.stepId} className="overflow-hidden rounded-lg border border-white/10">
                              {purl ? (
                                <img src={purl} alt={p.stepId} className="aspect-square w-full bg-black/30 object-cover" />
                              ) : (
                                <div className="aspect-square w-full bg-black/30" />
                              )}
                              <figcaption className="bg-black/40 px-1.5 py-1 text-[9px] font-medium leading-tight text-slate-300">
                                {stepLabelFor(r.question_id, p.stepId)}
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        {url && isImage(url) && (
                          <img src={url} alt="submission" className="max-h-44 w-full rounded-lg object-cover" />
                        )}
                        {url && isVideo(url) && (
                          <video src={url} controls className="max-h-44 w-full rounded-lg" />
                        )}
                        {url && !isImage(url) && !isVideo(url) && (
                          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-sky-300 underline">
                            Open uploaded file
                          </a>
                        )}
                        {!r.text_response &&
                          !url &&
                          r.response_data &&
                          Object.keys(r.response_data).length > 0 && (
                            <pre className="overflow-x-auto rounded-lg bg-black/30 p-2 text-[11px] text-slate-300">
                              {JSON.stringify(r.response_data, null, 2)}
                            </pre>
                          )}
                      </>
                    )}
                  </div>

                  {/* Grade controls */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busy === r.id}
                      onClick={() => grade(r, true, CORRECT_PTS)}
                      className="flex-1 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Correct +{CORRECT_PTS}
                    </button>
                    <button
                      disabled={busy === r.id}
                      onClick={() => grade(r, false, WRONG_PTS)}
                      className="flex-1 rounded-lg bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                    >
                      Wrong {WRONG_PTS}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
