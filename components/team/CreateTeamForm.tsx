// components/team/CreateTeamForm.tsx
//
// CREATE flow = three member-name fields; the team number is assigned
// automatically (read-only). JOIN flow = dropdown of existing teams.
// Logic is unchanged — this pass only restyles to match the SHE Day mockup.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTeam } from '@/lib/hooks/useTeam';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Mode = 'create' | 'join';
type ExistingTeam = { id: string; team_number: number };

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
);

export function CreateTeamForm() {
  const [mode, setMode] = useState<Mode>('create');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [sessionGroup, setSessionGroup] = useState<'morning' | 'afternoon'>('morning');
  const [existingTeams, setExistingTeams] = useState<ExistingTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { createTeam, joinTeam } = useTeam();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (mode !== 'join') return;
    const supabase = createClient();
    supabase
      .from('teams')
      .select('id, team_number')
      .order('team_number', { ascending: true })
      .then(({ data }) => setExistingTeams(data ?? []));
  }, [mode]);

  async function handleCreate() {
    setError(null);
    if (!member1.trim() || !member2.trim() || !member3.trim()) {
      setError(t('team.allNamesRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await createTeam(member1, member2, member3, sessionGroup);
      router.push('/play');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('team.createError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    setError(null);
    if (!selectedTeamId) {
      setError(t('team.chooseFromList'));
      return;
    }
    setSubmitting(true);
    try {
      await joinTeam(selectedTeamId);
      router.push('/play');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('team.joinError'));
    } finally {
      setSubmitting(false);
    }
  }

  const members: Array<[string, (v: string) => void, string]> = [
    [member1, setMember1, t('team.member1Placeholder')],
    [member2, setMember2, t('team.member2Placeholder')],
    [member3, setMember3, t('team.member3Placeholder')],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#0B2545]">{t('team.setupTitle')}</h2>
      <p className="mb-5 text-sm text-slate-500">{t('team.setupSubtitle')}</p>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => setMode('create')}
          className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'create' ? 'bg-[#E4002B] text-white shadow' : 'text-slate-600'}`}>
          {t('team.createNew')}
        </button>
        <button type="button" onClick={() => setMode('join')}
          className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'join' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600'}`}>
          {t('team.joinExisting')}
        </button>
      </div>

      {mode === 'create' ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>{t('team.autoNumberNote')}</span>
          </div>
          {members.map(([val, set, ph], i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-[#0B2545]">
              <PersonIcon />
              <input type="text" placeholder={ph} value={val} onChange={(e) => set(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none" />
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-[#0B2545]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <select value={sessionGroup} onChange={(e) => setSessionGroup(e.target.value as 'morning' | 'afternoon')} className="w-full bg-transparent py-2.5 text-sm outline-none">
              <option value="morning">{t('team.morningSession')}</option>
              <option value="afternoon">{t('team.afternoonSession')}</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={handleCreate} disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f] disabled:opacity-60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
            {submitting ? t('team.creating') : t('team.create')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none">
            <option value="">{t('team.selectYourTeam')}</option>
            {existingTeams.map((tm) => (
              <option key={tm.id} value={tm.id}>{t('common.team')} {tm.team_number}</option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={handleJoin} disabled={submitting}
            className="w-full rounded-xl bg-[#0B2545] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2f57] disabled:opacity-60">
            {submitting ? t('team.joining') : t('team.join')}
          </button>
        </div>
      )}
    </div>
  );
}
