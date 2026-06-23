// @ts-nocheck
// app/admin/preview/page.tsx — read-only walkthrough of every question.

'use client';

import { MODULES, getQuestionsForModule } from '@/lib/game/questions';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { QuestionInputSwitch } from '@/components/game/QuestionInputSwitch';

export default function PreviewAllPage() {
  const { tx } = useLanguage();
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <a href="/admin/dashboard" className="text-xs font-medium text-slate-500 transition hover:text-slate-800">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Preview all questions</h1>
        <p className="mt-1 text-sm text-slate-500">Read-only — inputs are disabled and nothing is saved.</p>

        {MODULES.map((m) => {
          const qs = getQuestionsForModule(m.id);
          return (
            <div key={m.id} className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Module {m.index}: {tx(m.title)}
              </h2>
              {qs.length === 0 ? (
                <p className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
                  Special module (QR wellbeing flow) — no standard questions.
                </p>
              ) : (
                <div className="mt-2 space-y-4">
                  {qs.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-3">
                        <span className="rounded-lg bg-[#E4002B] px-2.5 py-1 text-xs font-black text-white">Q{q.order}</span>
                      </div>
                      <p className="mb-4 text-base font-medium text-slate-900">{tx(q.prompt)}</p>
                      <div className="pointer-events-none select-none opacity-95">
                        <QuestionInputSwitch question={q} teamId="preview" disabled={true} onAnswer={() => {}} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
