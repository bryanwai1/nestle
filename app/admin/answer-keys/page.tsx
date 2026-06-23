// app/admin/answer-keys/page.tsx

import { AnswerKeyEditor } from '@/components/admin/AnswerKeyEditor';

export const dynamic = 'force-dynamic';

export default function AnswerKeysPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <a href="/admin/dashboard" className="text-xs text-slate-400 transition hover:text-slate-200">
          ← Back to dashboard
        </a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Answer Keys</h1>
        <p className="mt-1 max-w-xl text-sm text-slate-400">
          Edit the accepted keywords for auto-graded questions. Hitting <span className="font-semibold text-slate-200">Save &amp; re-grade</span> applies
          your change to every answer teams have already submitted — no redeploy needed.
        </p>
        <div className="mt-6">
          <AnswerKeyEditor />
        </div>
      </div>
    </main>
  );
}
