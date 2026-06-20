// components/game/inputs/shared.tsx

'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export function SubmitButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-6 w-full rounded-xl bg-[#0B2545] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 enabled:hover:bg-[#0d2f57]"
    >
      {label ?? t('input.submitAnswer')}
    </button>
  );
}

export function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm text-slate-500">{children}</p>;
}
