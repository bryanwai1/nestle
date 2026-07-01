// components/admin/TeamReleasePanel.tsx
//
// Shows teams that are paused waiting for admin review after submitting
// a module with media_upload questions. Admin can release individual teams
// or all at once to allow them to proceed to the next module.
// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES, getQuestionsForModule } from '@/lib/game/questions';

const MANUAL_REVIEW_MODULES = MODULES.filter((m) =>
  getQuestionsForModule(m.id).some((q) => q.responseType === 'media_upload')
).map((m) => m.id);

type PausedTeam = {
  team_id: string;
  team_number: number;
  module_id: string;
  completed_at: string;
};

export function TeamReleasePanel() {
  const [paused, setPaused] = useState<PausedTeam[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data: completions } = await supabase
      .from('team_module_progress')
      .select('team_id, module_id, completed_at, teams(team_number)')
      .eq('status', 'completed')
      .in('module_id', MANUAL_REVIEW_MODULES)
      .order('completed_at', { ascending: true });

    if (!completions) return;

    const { data: releases } = await supabase
      .from('team_releases')
      .select('team_id, module_id');

    const releasedSet = new Set((releases ?? []).map((r) => `${r.team_id}:${r.module_id}`));
    const waiting = completions
      .filter((c) => !releasedSet.has(`${c.team_id}:${c.module_id}`))
      .map((c) => ({
        team_id: c.team_id,
        team_number: (c.teams as any)?.team_number ?? '?',
        module_id: c.module_id,
        completed_at: c.completed_at,
      }));
    setPaused(waiting);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('release_panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_module_progress' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_releases' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function release(teamId: string, moduleId: string) {
    setBusy(`${teamId}:${moduleId}`);
    await (supabase as any).from('team_releases').upsert({ team_id: teamId, module_id: moduleId });
    setBusy(null);
    load();
  }

  async function releaseAll() {
    setBusy('all');
    await Promise.all(paused.map((p) =>
      (supabase as any).from('team_releases').upsert({ team_id: p.team_id, module_id: p.module_id })
    ));
    setBusy(null);
    load();
  }

  const moduleName = (id: string) => MODULES.find((m) => m.id === id)?.title?.en ?? id;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B2545] to-[#0a1d3a] p-5 shadow-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
        Pending Review
      </p>
      <h3 className="mt-1 text-lg font-bold text-white">
        Teams Waiting to Continue
      </h3>
      {paused.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No teams are currently waiting.</p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {paused.map((p) => (
              <div key={`${p.team_id}:${p.module_id}`}
                className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">Team {p.team_number}</p>
                  <p className="text-xs text-slate-400">{moduleName(p.module_id)}</p>
                </div>
                <button
                  onClick={() => release(p.team_id, p.module_id)}
                  disabled={busy !== null}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {busy === `${p.team_id}:${p.module_id}` ? 'Releasing…' : 'Release'}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={releaseAll}
            disabled={busy !== null}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy === 'all' ? 'Releasing all…' : `Release All (${paused.length})`}
          </button>
        </>
      )}
    </div>
  );
}
