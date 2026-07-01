// app/play/[moduleId]/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeam } from '@/lib/hooks/useTeam';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getModule, MODULES } from '@/lib/game/questions';
import { useModuleProgress } from '@/lib/hooks/useModuleProgress';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { QuestionRunner } from '@/components/game/QuestionRunner';
import { QRPrivacyFlow } from '@/components/game/QRPrivacyFlow';
import { FreezeOverlay } from '@/components/game/FreezeOverlay';

export default function ModulePlayPage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = params;
  const { team, loading } = useTeam();
  const router = useRouter();
  const gameModule = getModule(moduleId);
  const progress = useModuleProgress(team?.id);
  const [prevReleased, setPrevReleased] = useState<boolean | null>(null);
  const supabase = createClient();
  const moduleIndex = MODULES.findIndex(m => m.id === moduleId);
  const prevModule = moduleIndex > 0 ? MODULES[moduleIndex - 1] : null;
  const prevCompleted = prevModule !== null && (progress[prevModule.id] ?? 'not_started') === 'completed';
  const isLocked = prevModule !== null && (!prevCompleted || prevReleased === false);
  useEffect(() => {
    if (!team || !prevModule) { setPrevReleased(null); return; }
    async function checkRelease() {
      const { data } = await (supabase as any)
        .from('team_releases')
        .select('id')
        .eq('team_id', team!.id)
        .eq('module_id', prevModule!.id)
        .maybeSingle();
      setPrevReleased(!!data);
    }
    checkRelease();
    const ch = supabase.channel('rel-' + team.id + prevModule.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_releases' }, checkRelease)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [team?.id, prevModule?.id]);
  const { t } = useLanguage();


  if (loading || !team) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-center text-slate-400">{t('common.loading')}</main>;
  }

  if (!gameModule) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-slate-500">{t('play.notFound')}</p>
        <Link href="/play" className="mt-2 inline-block text-sm font-medium text-[#0B2545] underline">
          {t('play.backToModules')}
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <FreezeOverlay />
      {moduleId === 'module-4-mental-health' ? (
        <>
          <div className="mx-auto mb-4 max-w-2xl">
            <Link href="/play" className="text-sm font-medium text-slate-400 hover:text-slate-600">
              ← {t('play.allModules')}
            </Link>
          </div>
          <QRPrivacyFlow team={team} />
        </>
      ) : (
        <QuestionRunner moduleId={moduleId} team={team} />
      )}
    </main>
  );
}
