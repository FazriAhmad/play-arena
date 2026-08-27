import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Star, X } from 'lucide-react';
import { cn } from '../lib/utils';

/* ---------------- Button ---------------- */
type Variant = 'primary' | 'ghost' | 'outline' | 'danger' | 'subtle' | 'aqua';

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const variants: Record<Variant, string> = {
    primary:
      'bg-gradient-to-r from-neon-400 to-neon-500 text-ink-950 hover:from-neon-300 hover:to-neon-400 shadow-[0_10px_30px_-10px_rgba(189,244,55,0.7)]',
    aqua: 'bg-gradient-to-r from-aqua-300 to-aqua-400 text-ink-950 hover:brightness-110 shadow-[0_10px_30px_-10px_rgba(34,211,238,0.6)]',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    outline: 'border border-white/15 text-white hover:border-neon-400/60 hover:bg-neon-400/5',
    danger: 'bg-rose-500/90 text-white hover:bg-rose-500',
    subtle: 'bg-white/8 text-white hover:bg-white/14 border border-white/10',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

/* ---------------- Card ---------------- */
export const Card = ({
  className,
  children,
  hover,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) => (
  <div
    className={cn(
      'glass rounded-2xl',
      hover && 'transition-all duration-300 hover:border-neon-400/30 hover:shadow-[0_20px_60px_-30px_rgba(189,244,55,0.35)]',
      className,
    )}
  >
    {children}
  </div>
);

/* ---------------- Badge ---------------- */
export const Badge = ({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'neon' | 'violet';
  className?: string;
}) => {
  const tones = {
    neutral: 'bg-white/8 text-white/70 border-white/12',
    success: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    warn: 'bg-amber-500/12 text-amber-300 border-amber-400/25',
    danger: 'bg-rose-500/12 text-rose-300 border-rose-400/25',
    info: 'bg-sky-500/12 text-sky-300 border-sky-400/25',
    neon: 'bg-neon-400/12 text-neon-300 border-neon-400/30',
    violet: 'bg-violet-500/12 text-violet-300 border-violet-400/25',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};

/* ---------------- Form controls ---------------- */
export const Field = ({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={cn('block', className)}>
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/45">
      {label}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-white/40">{hint}</span>}
  </label>
);

const fieldBase =
  'w-full rounded-xl border border-white/12 bg-ink-900/80 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-neon-400/60 focus:ring-2 focus:ring-neon-400/15';

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(fieldBase, className)} {...rest} />
);

export const Textarea = ({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(fieldBase, 'min-h-24 resize-y', className)} {...rest} />
);

export const Select = ({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(fieldBase, 'appearance-none pr-8 [&>option]:bg-ink-900', className)} {...rest}>
    {children}
  </select>
);

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-neon-400/30"
  >
    <span
      className={cn(
        'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition',
        checked ? 'bg-neon-400' : 'bg-white/15',
      )}
    >
      <span
        className={cn(
          'h-4 w-4 rounded-full bg-ink-950 transition',
          checked && 'translate-x-4',
        )}
      />
    </span>
    <span>
      <span className="block text-sm font-semibold text-white">{label}</span>
      {description && <span className="block text-xs text-white/45">{description}</span>}
    </span>
  </button>
);

/* ---------------- Modal ---------------- */
export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn('glass-strong my-6 w-full rounded-3xl p-5 sm:p-7', wide ? 'max-w-4xl' : 'max-w-lg')}
            initial={{ y: 24, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ---------------- Stars ---------------- */
export const Stars = ({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) => (
  <span className={cn('inline-flex items-center gap-0.5', className)}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}
      />
    ))}
  </span>
);

export const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <button key={i} type="button" onClick={() => onChange(i)} className="transition hover:scale-110">
        <Star size={26} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-white/25'} />
      </button>
    ))}
  </div>
);

/* ---------------- Stat card ---------------- */
export const StatCard = ({
  label,
  value,
  delta,
  icon,
  tone = 'neon',
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  tone?: 'neon' | 'aqua' | 'violet' | 'amber' | 'rose';
}) => {
  const glow = {
    neon: 'from-neon-400/20',
    aqua: 'from-aqua-400/20',
    violet: 'from-violet-400/20',
    amber: 'from-amber-400/20',
    rose: 'from-rose-400/20',
  }[tone];
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={cn('absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl', glow)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
          {delta && <p className="mt-1 text-xs font-medium text-emerald-300">{delta}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70">{icon}</div>
      </div>
    </Card>
  );
};

/* ---------------- Tabs ---------------- */
export const Tabs = <T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) => (
  <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1', className)}>
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
          active === t.id ? 'bg-neon-400 text-ink-950' : 'text-white/55 hover:bg-white/5 hover:text-white',
        )}
      >
        {t.label}
        {t.count !== undefined && (
          <span
            className={cn(
              'rounded-full px-1.5 text-[10px]',
              active === t.id ? 'bg-ink-950/20' : 'bg-white/10',
            )}
          >
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

/* ---------------- Section heading ---------------- */
export const SectionHeading = ({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">
      {eyebrow && (
        <span className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-neon-400">
          <span className="h-1 w-6 rounded-full bg-neon-400" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-sm leading-relaxed text-white/50">{description}</p>}
    </div>
    {right}
  </div>
);

export const EmptyState = ({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 py-14 text-center">
    <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-white/40">{icon}</div>
    <p className="font-display text-lg font-semibold text-white">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-white/45">{description}</p>}
  </div>
);

/* ---------------- Toast ---------------- */
interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

const ToastCtx = createContext<{ push: (message: string, tone?: Toast['tone']) => void } | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl',
                t.tone === 'success' && 'border-neon-400/30 bg-ink-850/95 text-neon-300',
                t.tone === 'error' && 'border-rose-400/30 bg-ink-850/95 text-rose-200',
                t.tone === 'info' && 'border-aqua-400/30 bg-ink-850/95 text-aqua-300',
              )}
            >
              {t.tone === 'success' ? <Check size={16} className="mt-0.5" /> : t.tone === 'error' ? <X size={16} className="mt-0.5" /> : <span className="mt-0.5 text-xs">●</span>}
              <span className="text-white/85">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
};
