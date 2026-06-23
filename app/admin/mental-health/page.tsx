// app/admin/mental-health/page.tsx

import { MentalHealthManagerView } from '@/components/admin/MentalHealthManagerView';

export const dynamic = 'force-dynamic';

export default function MentalHealthManagerPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <a href="/admin/dashboard" className="text-xs text-slate-400 transition hover:text-slate-200">← Back to dashboard</a>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Wellbeing Check-ins</h1>
        <p className="mt-1 text-sm text-slate-400">Confidential to management. Each person’s name, score and answers are shown here only.</p>
        <div className="mt-6"><MentalHealthManagerView /></div>
      </div>
    </main>
  );
}
