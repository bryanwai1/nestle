// lib/i18n/LanguageContext.tsx
//
// Wraps the whole app (see app/layout.tsx). Language choice is stored in
// localStorage so it survives reloads and carries across every screen — the
// toggle works "anytime", including mid-question, since it's read fresh on
// every render rather than being passed down as a one-time prop.

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Lang, Text } from '@/types/game';
import { UI_STRINGS, interpolate, type UIKey } from './ui';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Static UI chrome — buttons, labels, helper text. */
  t: (key: UIKey, vars?: Record<string, string | number>) => string;
  /** Bilingual content from the question bank — prompts, options, etc. */
  tx: (text: Text) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = 'she-day-2026:lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === 'en' || stored === 'bm') setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggleLang = useCallback(() => setLang(lang === 'en' ? 'bm' : 'en'), [lang, setLang]);

  const t = useCallback(
    (key: UIKey, vars?: Record<string, string | number>) => {
      const raw = UI_STRINGS[key][lang];
      return vars ? interpolate(raw, vars) : raw;
    },
    [lang]
  );

  const tx = useCallback((text: Text) => text[lang], [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, tx }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a <LanguageProvider>');
  return ctx;
}
