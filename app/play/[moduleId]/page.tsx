// app/play/[moduleId]/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeam } from '@/lib/hooks/useTeam';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getModule } from '@/lib/game/questions';
import { QuestionRunner } from '@/components/game/QuestionRunner';
import { QRPrivacyFlow } from '@/components/game/QRPrivacyFlow';
import { FreezeOverlay } from '@/components/game/FreezeOverlay';

export default function ModulePlayPage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = params;
  const { team, loading } = useTeam();
  const router = useRouter();
  const gameModule = getModule(moduleId);
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && !team) router.replace('/');
  }, [loading, team, router]);

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
    <main className="px-4 py-8">
      <FreezeOverlay />
      <div className="mx-auto mb-4 max-w-2xl">
        <Link href="/play" className="text-sm font-medium text-slate-400 hover:text-slate-600">
          ← {t('play.allModules')}
        </Link>
      </div>
      {moduleId === 'module-4-mental-health' ? (
        <QRPrivacyFlow team={team} />
      ) : (
        <QuestionRunner moduleId={moduleId} team={team} />
      )}
    </main>
  );
}
