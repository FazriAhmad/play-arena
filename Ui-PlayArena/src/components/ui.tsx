import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export const Button = ({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-[#1d5fc4] to-[#2f6fd6] text-white hover:from-[#164a9c] hover:to-[#1d5fc4] shadow-sm shadow-[#1d5fc4]/30',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>{children}</div>
);

export const Field = ({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) => (
  <label className={cn('block', className)}>
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
    {children}
    {error ? (
      <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>
    ) : hint ? (
      <span className="mt-1 block text-xs text-slate-400">{hint}</span>
    ) : null}
  </label>
);

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15',
      className,
    )}
    {...rest}
  />
);

export const Badge = ({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
}) => {
  const tones = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', tones[tone])}>
      {children}
    </span>
  );
};

/** Modul 13 — rating bintang, read-only (dari data agregat) atau bisa dipilih (form review). */
export const Stars = ({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) => (
  <div className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={!onChange}
        onClick={() => onChange?.(n)}
        className={cn('leading-none', onChange && 'cursor-pointer')}
        style={{ fontSize: size, color: n <= Math.round(value) ? '#f59e0b' : '#e2e8f0' }}
        aria-label={`${n} bintang`}
      >
        ★
      </button>
    ))}
  </div>
);
