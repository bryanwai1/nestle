// components/game/QRPrivacyFlow.tsx
//
// Module 4 — wellbeing check-in. Confidential-to-management (NOT anonymous):
// each person enters their name on the assessment page; results are readable
// only by a manager with the password (see migration 0007). The QR sends
// other phones to PRODUCTION so a preview deploy can never break the link;
// the "Do my own check-in" button opens the same form on this device for the
// person holding the team phone.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { useGameTimer } from '@/lib/hooks/useGameTimer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MODULES } from '@/lib/game/questions';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

// Hardcoded so the QR always points at the live site, even when this screen
// is shown from a Vercel preview URL (those are login-gated and would 404 a
// scanning phone). Update if the production domain ever changes.
const PROD_BASE = 'https://nestle-lovat.vercel.app';

export function QRPrivacyFlow({ team }: { team: Team }) {
  const [confirmedDone, setConfirmedDone] = useState(false);
  const batchSessionId = `${new Date().toISOString().slice(0, 10)}-${team.session_group}`;
  const { lang, t, tx } = useLanguage();

  const timer = useGameTimer({ durationSeconds: 5 * 60 });

  const query = `batch=${batchSessionId}&lang=${lang}&team=${team.id}`;
  const assessmentUrl = `${PROD_BASE}/mental-health-assessment?${query}`; // for OTHER phones (QR)
  const ownCheckinPath = `/mental-health-assessment?${query}`; // for THIS device

  const note = {
    en: 'Scan to do a private wellbeing check-in. Your answers are shared only with your manager for support — not with your teammates.',
    bm: 'Imbas untuk semakan kesejahteraan secara peribadi. Jawapan anda dikongsi hanya dengan pengurus anda untuk sokongan — bukan dengan rakan sepasukan.',
  };

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
      <p className="mt-2 text-sm text-slate-500">{tx(note)}</p>

      <div className="my-6 flex justify-center">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4">
          <QRCodeSVG value={assessmentUrl} size={180} />
        </div>
      </div>

      <Link
        href={ownCheckinPath}
        className="mb-4 block w-full rounded-xl border border-[#0B2545] px-5 py-3 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545]/5"
      >
        {tx({ en: 'Do my own check-in on this phone', bm: 'Buat semakan saya di telefon ini' })}
      </Link>

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