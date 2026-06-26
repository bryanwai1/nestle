// app/admin/login/page.tsx — facilitator login, styled to match the SHE Day theme

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    router.push('/admin/dashboard');
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-[#eaf4fb] via-[#f3f8fc] to-white px-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[45%] w-full object-cover object-bottom"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col items-center justify-center py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/she-day-logo.png/image001.png" alt="Nestlé SHE Day" className="h-12 w-auto" />
        <p className="mt-3 text-xs font-medium tracking-wide text-slate-500">Safety · Health · Environment</p>

        <h1 className="mt-6 text-2xl font-extrabold text-[#0B2545]">Welcome Back!</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to continue the challenge</p>

        <form onSubmit={handleSubmit} className="mt-6 w-full rounded-2xl border border-white/60 bg-white/95 p-6 shadow-xl backdrop-blur">
          <label className="mb-1.5 block text-sm font-semibold text-[#0B2545]">Email</label>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-[#0B2545]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-transparent py-2.5 text-sm outline-none" />
          </div>

          <label className="mb-1.5 block text-sm font-semibold text-[#0B2545]">Password</label>
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-[#0B2545]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full bg-transparent py-2.5 text-sm outline-none" />
            <button type="button" onClick={() => setShow((s) => !s)} className="shrink-0 text-slate-400 transition hover:text-slate-600" aria-label="Show or hide password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-[#E4002B]" />
              Remember me
            </label>
            <a href="/" className="text-sm font-medium text-[#E4002B] hover:underline">Forgot password?</a>
          </div>

          {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E4002B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c4001f] disabled:opacity-60">
            {submitting ? 'Signing in…' : 'Log In'}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">New here? Contact your administrator to get started.</p>
        </form>
      </div>

      <div className="relative z-10 mb-6 rounded-xl bg-white/70 px-4 py-2 text-center backdrop-blur">
        <p className="text-sm font-bold text-[#0B2545]">SHE Day Challenge 2026</p>
        <p className="text-xs text-slate-500">Together, we build a safer and healthier tomorrow.</p>
      </div>
    </main>
  );
}
