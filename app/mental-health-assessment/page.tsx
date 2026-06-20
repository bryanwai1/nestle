// app/mental-health-assessment/page.tsx
//
// Reached only via the QR code in QRPrivacyFlow. Nothing on this page ever
// collects a name, team, or device identifier — the only thing written to
// Supabase is (batch_session_id, score, bracket). See the schema comment in
// 0001_init.sql for why that's a structural guarantee, not just a UI choice.

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import type { Lang, Text } from '@/types/game';

const STATEMENTS: Text[] = [
  { en: 'I feel stressed or overwhelmed most of the time', bm: 'Saya rasa tertekan atau terbeban hampir sepanjang masa' },
  { en: 'I have trouble sleeping or my sleep is not restful', bm: 'Saya sukar tidur atau tidur saya tidak nyenyak' },
  { en: 'I feel anxious, worried, or unable to relax', bm: 'Saya rasa cemas, risau, atau sukar untuk berehat' },
  { en: 'I feel low, down, or lack motivation', bm: 'Saya rasa sedih, murung, atau kurang motivasi' },
  { en: 'I find it hard to concentrate on tasks', bm: 'Saya sukar untuk fokus pada tugasan' },
  { en: 'I feel easily irritated or frustrated', bm: 'Saya mudah rasa marah atau kecewa' },
  { en: 'I have lost interest in things I usually enjoy', bm: 'Saya hilang minat pada perkara yang biasa saya gemari' },
  { en: 'I feel physically tired even without much activity', bm: 'Saya rasa letih walaupun tidak banyak bergerak' },
  { en: 'I find it hard to cope with daily responsibilities', bm: 'Saya sukar menguruskan tanggungjawab harian' },
  { en: 'I feel cut off or distant from other people', bm: 'Saya rasa terasing atau jauh daripada orang lain' },
];

const SCALE: Array<{ value: number; key: 'mh.scale.never' | 'mh.scale.sometimes' | 'mh.scale.often' | 'mh.scale.almostAlways' }> = [
  { value: 0, key: 'mh.scale.never' },
  { value: 1, key: 'mh.scale.sometimes' },
  { value: 2, key: 'mh.scale.often' },
  { value: 3, key: 'mh.scale.almostAlways' },
];

function bracketFor(score: number): 'low' | 'moderate' | 'high' | 'very_high' {
  if (score <= 7) return 'low';
  if (score <= 21) return 'moderate';
  if (score <= 25) return 'high';
  return 'very_high';
}

const ADVICE: Record<string, { title: Text; tips: Text[] }> = {
  low: {
    title: { en: 'You seem to be coping well', bm: 'Anda kelihatan mengawal keadaan dengan baik' },
    tips: [
      { en: 'Keep up regular exercise and 7\u20138 hours of sleep', bm: 'Teruskan bersenam secara berkala dan tidur 7\u20138 jam' },
      { en: 'Take short breaks during work', bm: 'Ambil rehat sekejap semasa bekerja' },
      { en: 'Stay socially connected', bm: 'Kekal berhubung dengan orang sekeliling' },
    ],
  },
  moderate: {
    title: { en: 'There are some signs of stress worth watching', bm: 'Ada tanda tekanan yang perlu diberi perhatian' },
    tips: [
      { en: 'Prioritize tasks instead of carrying everything at once', bm: 'Susun keutamaan tugas, jangan tanggung semuanya sekali gus' },
      { en: '5\u201310 minutes of deep breathing or relaxation daily', bm: '5\u201310 minit pernafasan dalam atau relaksasi setiap hari' },
      { en: 'Talk to someone you trust', bm: 'Berbual dengan seseorang yang anda percayai' },
      { en: 'Cut back on caffeine and screens before bed', bm: 'Kurangkan kafein dan skrin sebelum tidur' },
    ],
  },
  high: {
    title: { en: 'Your answers suggest a higher level of stress', bm: 'Jawapan anda menunjukkan tahap tekanan yang lebih tinggi' },
    tips: [
      { en: 'Consider lifestyle changes and lean on your support network', bm: 'Pertimbangkan perubahan gaya hidup dan dapatkan sokongan orang sekeliling' },
      { en: 'Speak with a trusted colleague, friend, or family member', bm: 'Berbual dengan rakan sekerja, kawan, atau ahli keluarga yang dipercayai' },
      { en: "Don't carry this alone", bm: 'Jangan tanggung sendirian' },
    ],
  },
  very_high: {
    title: { en: "It's worth reaching out for support soon", bm: 'Eloknya dapatkan sokongan tidak lama lagi' },
    tips: [
      { en: 'Speak to a trusted friend or family member', bm: 'Berbual dengan kawan atau ahli keluarga yang dipercayai' },
      { en: 'Consider talking to a counsellor or doctor', bm: 'Pertimbangkan untuk berjumpa kaunselor atau doktor' },
      { en: "You don't have to handle this by yourself", bm: 'Anda tidak perlu hadapi ini seorang diri' },
    ],
  },
};

function AssessmentForm() {
  const params = useSearchParams();
  const batch = params.get('batch') ?? `unspecified-${new Date().toISOString().slice(0, 10)}`;
  const { lang, setLang, t, tx } = useLanguage();

  // If the QR code carried a language (see QRPrivacyFlow), open already set
  // to it — the team member shouldn't have to re-toggle on a second device.
  useEffect(() => {
    const urlLang = params.get('lang');
    if (urlLang === 'en' || urlLang === 'bm') setLang(urlLang as Lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [answers, setAnswers] = useState<Array<number | null>>(Array(STATEMENTS.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  const allAnswered = answers.every((a) => a !== null);

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    const total = answers.reduce((s: number, a) => s + (a ?? 0), 0);
    const bracket = bracketFor(total);

    const supabase = createClient();
    await supabase.from('anonymous_mental_health_metrics').insert({
      batch_session_id: batch,
      raw_calculated_score: total,
      interpretation_bracket: bracket,
    });

    setScore(total);
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    const bracket = bracketFor(score);
    const advice = ADVICE[bracket];
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-end"><LanguageToggle /></div>
        <h2 className="text-xl font-semibold text-slate-900">{tx(advice.title)}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('mh.scoreLabel')}: {score} / 30 — {t('mh.keptPrivate')}.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {advice.tips.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#0B2545]">•</span>
              {tx(tip)}
            </li>
          ))}
        </ul>
        {(bracket === 'high' || bracket === 'very_high') && (
          <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">{t('mh.crisisNote')}</p>
        )}
        <p className="mt-6 text-center text-xs text-slate-400">{t('mh.closeTab')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{t('mh.checkinTitle')}</h1>
        <LanguageToggle />
      </div>
      <p className="mb-5 text-sm text-slate-500">{t('mh.checkinDescription')}</p>

      <div className="space-y-5">
        {STATEMENTS.map((statement, i) => (
          <div key={i}>
            <p className="mb-2 text-sm text-slate-700">{i + 1}. {tx(statement)}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {SCALE.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers((a) => a.map((v, idx) => (idx === i ? opt.value : v)))}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-medium transition ${
                    answers[i] === opt.value
                      ? 'border-[#0B2545] bg-[#0B2545] text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="mt-6 w-full rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        {submitting ? t('mh.submitting') : t('mh.submitPrivately')}
      </button>
    </div>
  );
}

export default function MentalHealthAssessmentPage() {
  return (
    <main className="px-4 py-8">
      <Suspense fallback={<p className="text-center text-slate-400">Loading…</p>}>
        <AssessmentForm />
      </Suspense>
    </main>
  );
}
