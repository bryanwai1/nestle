// app/admin/report/page.tsx
// Downloadable CSV report of all teams, scores, module progress, and answers.
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES } from '@/lib/game/questions';
import Link from 'next/link';

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const supabase = createClient();

  async function downloadReport() {
    setLoading(true);
    const [{ data: teams }, { data: progress }, { data: responses }, { data: bonuses }] = await Promise.all([
      (supabase as any).from('teams').select('id,team_number,member_1_name,member_2_name,member_3_name,member_4_name,current_total_score,region,registration_time').order('current_total_score', { ascending: false }),
      (supabase as any).from('team_module_progress').select('team_id,module_id,status,completed_at'),
      (supabase as any).from('game_responses').select('team_id,module_id,question_id,response_type,is_correct,points_awarded'),
      (supabase as any).from('session_speed_bonus').select('team_id,module_id,points'),
    ]);

    const rows: string[][] = [];
    const moduleIds = MODULES.map(m => m.id);

    // Header
    const header = [
      'Rank','Team','Member 1','Member 2','Member 3','Member 4','Session','Total Score','Speed Bonuses',
      ...MODULES.map(m => `Module ${m.index} Status`),
      ...MODULES.map(m => `Module ${m.index} Score`),
    ];
    rows.push(header);

    teams?.forEach((team: any, idx: number) => {
      const tp = (progress ?? []).filter((p: any) => p.team_id === team.id);
      const tr = (responses ?? []).filter((r: any) => r.team_id === team.id);
      const tb = (bonuses ?? []).filter((b: any) => b.team_id === team.id);
      const speedBonusTotal = tb.reduce((s: number, b: any) => s + b.points, 0);

      const moduleStatuses = moduleIds.map(mid => {
        const mp = tp.find((p: any) => p.module_id === mid);
        return mp?.status ?? 'not_started';
      });
      const moduleScores = moduleIds.map(mid => {
        const pts = tr.filter((r: any) => r.module_id === mid).reduce((s: number, r: any) => s + (r.points_awarded ?? 0), 0);
        const bonus = tb.find((b: any) => b.module_id === mid)?.points ?? 0;
        return pts + bonus;
      });

      rows.push([
        String(idx + 1),
        `Team ${team.team_number}`,
        team.member_1_name ?? '',
        team.member_2_name ?? '',
        team.member_3_name ?? '',
        team.member_4_name ?? '',
        team.region ?? '',
        String(team.current_total_score),
        String(speedBonusTotal),
        ...moduleStatuses,
        ...moduleScores.map(String),
      ]);
    });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `she-day-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
    setGenerated(true);
  }

  return (
    <div className="min-h-screen bg-[#070f1f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">Download Report</h1>
          <Link href="/admin/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5">
            ← Dashboard
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-white mb-2">Session Report</h2>
          <p className="text-sm text-slate-400 mb-6">Downloads a CSV with all teams, scores, module progress, member names, session, and speed bonuses.</p>
          <button onClick={downloadReport} disabled={loading}
            className="rounded-xl bg-[#E4002B] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f] disabled:opacity-50">
            {loading ? 'Generating…' : '⬇ Download CSV Report'}
          </button>
          {generated && <p className="mt-4 text-sm text-emerald-400">✓ Report downloaded successfully</p>}
        </div>
      </div>
    </div>
  );
}
