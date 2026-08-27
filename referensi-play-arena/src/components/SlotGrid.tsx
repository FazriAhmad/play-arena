import { cn, hourLabel } from '../lib/utils';
import type { SlotStatus } from '../lib/utils';

const STATE_STYLE: Record<SlotStatus['state'], string> = {
  available: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer',
  booked: 'bg-rose-500/10 border-rose-400/25 text-rose-300/80 cursor-not-allowed',
  pending: 'bg-amber-500/10 border-amber-400/25 text-amber-300/80 cursor-not-allowed',
  blocked: 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed',
  past: 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed',
  hold: 'bg-violet-500/10 border-violet-400/25 text-violet-300/80 cursor-not-allowed animate-pulse',
};

export const SlotGrid = ({
  slots,
  selectedStart,
  durationHours,
  onSelect,
  compact,
}: {
  slots: SlotStatus[];
  selectedStart?: number | null;
  durationHours?: number;
  onSelect?: (hour: number) => void;
  compact?: boolean;
}) => (
  <div className={cn('grid gap-2', compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6')}>
    {slots.map((s) => {
      const inSelection =
        selectedStart != null &&
        durationHours &&
        s.hour >= selectedStart &&
        s.hour < selectedStart + durationHours;
      return (
        <button
          key={s.hour}
          type="button"
          disabled={s.state !== 'available'}
          title={s.label}
          onClick={() => onSelect?.(s.hour)}
          className={cn(
            'relative rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition',
            STATE_STYLE[s.state],
            !!inSelection && 'border-neon-400 bg-neon-400/25 text-neon-200 ring-2 ring-neon-400/40',
          )}
        >
          {hourLabel(s.hour)}
        </button>
      );
    })}
  </div>
);

export const SlotLegend = () => (
  <div className="flex flex-wrap gap-3 text-[11px] text-white/50">
    {[
      ['bg-emerald-400', 'Tersedia'],
      ['bg-neon-400', 'Dipilih'],
      ['bg-amber-400', 'Menunggu Konfirmasi'],
      ['bg-rose-400', 'Terisi'],
      ['bg-violet-400', 'Sedang diproses user lain'],
      ['bg-white/30', 'Diblokir / Lewat'],
    ].map(([dot, label]) => (
      <span key={label} className="flex items-center gap-1.5">
        <span className={cn('h-2.5 w-2.5 rounded-full', dot)} /> {label}
      </span>
    ))}
  </div>
);
