// components/LanguageToggle.tsx

'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export function LanguageToggle({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { lang, setLang } = useLanguage();
  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center rounded-full p-0.5 text-xs font-bold ${
        isDark ? 'bg-white/10' : 'bg-slate-100'
      }`}
    >
      {(['en', 'bm'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
            lang === l
              ? 'bg-[#E4002B] text-white shadow'
              : isDark
              ? 'text-white/60 hover:text-white'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
