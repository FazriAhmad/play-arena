import { cn } from '../lib/utils';

export interface Slot {
  hour: number;
  state: 'available' | 'booked' | 'blocked' | 'past';
  label: string;
}

const STATE_STYLE: Record<Slot['state'], string> = {
  available: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400',
  booked: 'border-rose-500/30 bg-rose-500/10 text-rose-400 cursor-not-allowed',
  blocked: 'border-amber-500/30 bg-amber-500/10 text-amber-400 cursor-not-allowed',
  past: 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed',
};

export default function SlotGrid({
  slots,
  selectedHour,
  onSelectHour,
}: {
  slots: Slot[];
  selectedHour?: number | null;
  onSelectHour?: (hour: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {slots.map((s) => (
        <button
          key={s.hour}
          type="button"
          disabled={s.state !== 'available'}
          onClick={() => onSelectHour?.(s.hour)}
          title={s.label}
          className={cn(
            'rounded-lg border px-2 py-2.5 text-center text-xs font-semibold transition',
            STATE_STYLE[s.state],
            selectedHour === s.hour && 'ring-2 ring-[#1d5fc4] ring-offset-1',
          )}
        >
          {String(s.hour).padStart(2, '0')}:00
        </button>
      ))}
    </div>
  );
}
