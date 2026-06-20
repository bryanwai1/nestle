// components/game/QRPrivacyFlow.tsx
//
// Module 4 deliberately does NOT go through QuestionRunner / game_responses
// at all. The brief is explicit that this needs to be anonymous — so there
// is no team_id anywhere in this flow. The QR code just routes a phone to
// /mental-health-assessment, a standalone route with its own write path
// straight into anonymous_mental_health_metrics (see that page + the schema
// note in 0001_init.sql for why the table has no identifying column).

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { useGameTimer } from '@/lib/hooks/useGameTimer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MODULES } from '@/lib/game/questions';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

export function QRPrivacyFlow({ team }: { team: Team }) {
  const [origin, setOrigin] = useState('');
  const [confirmedDone, setConfirmedDone] = useState(false);
  const batchSessionId = `${new Date().toISOString().slice(0, 10)}-${team.session_group}`;
  const { lang, t, tx } = useLanguage();

  useEffect(() => setOrigin(window.location.origin), []);

  const timer = useGameTimer({ durationSeconds: 5 * 60 });

  async function finishModule() {
    const supabase = createClient();
    await supabase.from('team_module_progress').upsert(
      {
        team_id: team.id,
        module_id: 'module-4-mental-health',
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'team_id,module_id' }
    );
    setConfirmedDone(true);
  }

  const nextModule = MODULES.find((m) => m.index === 5);
  // Carries the team's current language choice through the QR code, so the
  // private assessment opens already set to whichever language they were
  // playing in — no need to toggle again on a second device.
  const assessmentUrl = origin ? `${origin}/mental-health-assessment?batch=${batchSessionId}&lang=${lang}` : '';

  if (confirmedDone) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{t('mh.thanksTitle')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('mh.thanksSubtitle')}</p>
        {nextModule && (
          <Link
            href={`/play/${nextModule.id}`}
            className="mt-6 inline-block rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f]"
          >
            {t('complete.startModule')} {nextModule.index}: {tx(nextModule.title)}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]/60">{t('mh.moduleLabel')}</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">{t('mh.privateTitle')}</h2>
      <p className="mt-2 text-sm text-slate-500">{t('mh.privateDescription')}</p>

      <div className="my-6 flex justify-center">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4">
          {assessmentUrl ? <QRCodeSVG value={assessmentUrl} size={180} /> : <div className="h-[180px] w-[180px]" />}
        </div>
      </div>

      <div
        className={`mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold tabular-nums ${
          timer.isLow ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {timer.display} {t('mh.remaining')}
      </div>

      <button
        type="button"
        onClick={finishModule}
        className="block w-full rounded-xl bg-[#0B2545] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2f57]"
      >
        {t('mh.everyoneSubmitted')}
      </button>
    </div>
  );
}
