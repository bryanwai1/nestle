// components/team/CreateTeamForm.tsx
//
// Wireframe page 1 annotated the team-name field with "Drop Down box" — read
// in context, that's for the JOIN flow: picking an existing team should be a
// dropdown of real teams, not a free-text guess at a number. The CREATE flow
// stays as three name fields; the team number is assigned automatically and
// shown read-only, never typed.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTeam } from '@/lib/hooks/useTeam';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Mode = 'create' | 'join';
type ExistingTeam = { id: string; team_number: number };

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{t('team.setupTitle')}</h2>
      <p className="mb-5 text-sm text-slate-500">{t('team.setupSubtitle')}</p>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            mode === 'create' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600'
          }`}
        >
          {t('team.createNew')}
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            mode === 'join' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600'
          }`}
        >
          {t('team.joinExisting')}
        </button>
      </div>

      {mode === 'create' ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-500">{t('team.autoNumberNote')}</p>
          <input
            type="text" placeholder={t('team.member1Placeholder')} value={member1}
            onChange={(e) => setMember1(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
          />
          <input
            type="text" placeholder={t('team.member2Placeholder')} value={member2}
            onChange={(e) => setMember2(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
          />
          <input
            type="text" placeholder={t('team.member3Placeholder')} value={member3}
            onChange={(e) => setMember3(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
          />
          <select
            value={sessionGroup}
            onChange={(e) => setSessionGroup(e.target.value as 'morning' | 'afternoon')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
          >
            <option value="morning">{t('team.morningSession')}</option>
            <option value="afternoon">{t('team.afternoonSession')}</option>
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="w-full rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f] disabled:opacity-60"
          >
            {submitting ? t('team.creating') : t('team.create')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Dropdown, per wireframe annotation — never free-text for joining */}
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0B2545] focus:outline-none"
          >
            <option value="">{t('team.selectYourTeam')}</option>
            {existingTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {t('common.team')} {team.team_number}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleJoin}
            disabled={submitting}
            className="w-full rounded-xl bg-[#0B2545] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2f57] disabled:opacity-60"
          >
            {submitting ? t('team.joining') : t('team.join')}
          </button>
        </div>
      )}
    </div>
  );
}
