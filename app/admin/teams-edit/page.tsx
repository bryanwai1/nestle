// app/admin/teams-edit/page.tsx
// Admin can view and edit team member names, including adding a 4th member.
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Team = {
  id: string;
  team_number: number;
  member_1_name: string;
  member_2_name: string;
  member_3_name: string;
  member_4_name?: string;
  region?: string;
};

export default function TeamsEditPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Team>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await (supabase as any)
      .from('teams')
      .select('id,team_number,member_1_name,member_2_name,member_3_name,member_4_name,region')
      .order('team_number');
    if (data) setTeams(data);
  }

  useEffect(() => { load(); }, []);

  function startEdit(team: Team) {
    setEditing(team.id);
    setForm({ ...team });
    setMsg(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from('teams')
      .update({
        member_1_name: form.member_1_name,
        member_2_name: form.member_2_name,
        member_3_name: form.member_3_name,
        member_4_name: form.member_4_name || null,
      })
      .eq('id', editing);
    setBusy(false);
    if (error) {
      setMsg('Failed to save — ' + error.message);
    } else {
      setMsg('Saved successfully');
      setEditing(null);
      load();
    }
  }

  return (
    <div className="min-h-screen bg-[#070f1f] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Edit Team Members</h1>
            <p className="text-sm text-slate-400 mt-1">Add or update member names for any team</p>
          </div>
          <Link href="/admin/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5">
            ← Dashboard
          </Link>
        </div>

        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {editing === team.id ? (
                <div>
                  <p className="font-bold text-white mb-3">Team {team.team_number} — Editing</p>
                  {['member_1_name','member_2_name','member_3_name'].map((field, i) => (
                    <div key={field} className="mb-2">
                      <label className="text-xs text-slate-400 mb-1 block">Member {i+1}</label>
                      <input
                        type="text"
                        value={(form as any)[field] ?? ''}
                        onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                  <div className="mb-3">
                    <label className="text-xs text-slate-400 mb-1 block">Member 4 (optional)</label>
                    <input
                      type="text"
                      value={form.member_4_name ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, member_4_name: e.target.value }))}
                      placeholder="Leave blank if no 4th member"
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 placeholder:text-slate-500"
                    />
                  </div>
                  {msg && <p className="text-xs text-emerald-400 mb-2">{msg}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={busy}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                      {busy ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Team {team.team_number}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[team.member_1_name, team.member_2_name, team.member_3_name, team.member_4_name].filter(Boolean).join(' · ')}
                    </p>
                    {team.region && <p className="text-xs text-sky-400 mt-0.5">{team.region}</p>}
                  </div>
                  <button onClick={() => startEdit(team)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10">
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
