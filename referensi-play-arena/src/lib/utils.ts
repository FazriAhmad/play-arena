import type { Booking, BlockSlot } from './types';

export const cn = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

export const rupiah = (n: number) =>
  'Rp' + Math.round(n).toLocaleString('id-ID');

export const rupiahShort = (n: number) => {
  if (n >= 1_000_000) return 'Rp' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'jt';
  if (n >= 1_000) return 'Rp' + Math.round(n / 1_000) + 'rb';
  return rupiah(n);
};

export const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAYS_LONG = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];
export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const todayISO = () => toISO(new Date());

export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

export const fmtDateShort = (s: string) => {
  const d = parseISO(s);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fmtDateLong = (s: string) => {
  const d = parseISO(s);
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const nextDays = (n: number, from = todayISO()) =>
  Array.from({ length: n }, (_, i) => addDays(from, i));

/** jam berikutnya yang masih bisa dipesan (minimal 1 jam dari sekarang) */
export const firstBookableHour = () => new Date().getHours() + 1;

export const overlaps = (
  aStart: number,
  aDur: number,
  bStart: number,
  bDur: number,
) => aStart < bStart + bDur && bStart < aStart + aDur;

export const isActiveBooking = (b: Booking) =>
  b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed';

export interface SlotStatus {
  hour: number;
  state: 'available' | 'booked' | 'blocked' | 'pending' | 'past' | 'hold';
  booking?: Booking;
  label: string;
}

export const buildSlots = (
  openHour: number,
  closeHour: number,
  date: string,
  bookings: Booking[],
  blocks: BlockSlot[],
  liveHolds: { courtId: string; date: string; startHour: number }[],
  courtId: string,
): SlotStatus[] => {
  const now = new Date();
  const isToday = date === todayISO();
  return Array.from({ length: Math.max(0, closeHour - openHour) }, (_, i) => {
    const hour = openHour + i;
    if (isToday && hour <= now.getHours())
      return { hour, state: 'past' as const, label: 'Sudah lewat' };
    const hold = liveHolds.find(
      (h) => h.courtId === courtId && h.date === date && h.startHour === hour,
    );
    if (hold) return { hour, state: 'hold' as const, label: 'Sedang dipesan orang lain' };
    const block = blocks.find(
      (b) =>
        b.courtId === courtId &&
        b.date === date &&
        overlaps(hour, 1, b.startHour, b.durationHours),
    );
    if (block) return { hour, state: 'blocked' as const, label: block.reason };
    const booking = bookings.find(
      (b) =>
        b.courtId === courtId &&
        b.date === date &&
        isActiveBooking(b) &&
        overlaps(hour, 1, b.startHour, b.durationHours),
    );
    if (booking)
      return {
        hour,
        state: booking.status === 'pending' ? 'pending' : 'booked',
        booking,
        label: booking.status === 'pending' ? 'Menunggu konfirmasi' : 'Terisi',
      };
    return { hour, state: 'available' as const, label: 'Tersedia' };
  });
};

export const findConflict = (
  bookings: Booking[],
  blocks: BlockSlot[],
  liveHolds: { courtId: string; date: string; startHour: number }[],
  courtId: string,
  date: string,
  startHour: number,
  durationHours: number,
): string | null => {
  for (const h of Array.from({ length: durationHours }, (_, i) => startHour + i)) {
    const hold = liveHolds.find(
      (x) => x.courtId === courtId && x.date === date && x.startHour === h,
    );
    if (hold) return `Jam ${hourLabel(h)} sedang dalam proses pemesanan oleh pengguna lain`;
  }
  const block = blocks.find(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      overlaps(startHour, durationHours, b.startHour, b.durationHours),
  );
  if (block)
    return `Slot diblokir pengelola: ${block.reason} (${hourLabel(block.startHour)}–${hourLabel(
      block.startHour + block.durationHours,
    )})`;
  const clash = bookings.find(
    (b) =>
      b.courtId === courtId &&
      b.date === date &&
      isActiveBooking(b) &&
      overlaps(startHour, durationHours, b.startHour, b.durationHours),
  );
  if (clash)
    return `Bentrok dengan booking ${clash.code} (${hourLabel(clash.startHour)}–${hourLabel(
      clash.startHour + clash.durationHours,
    )})`;
  return null;
};

export const hoursUntil = (date: string, startHour: number) => {
  const target = parseISO(date);
  target.setHours(startHour, 0, 0, 0);
  return (target.getTime() - Date.now()) / 3_600_000;
};

export interface RefundRule {
  min: number;
  label: string;
  pct: number;
}

export const REFUND_RULES: RefundRule[] = [
  { min: 48, label: '≥ 48 jam sebelum jadwal', pct: 100 },
  { min: 24, label: '24 – 48 jam sebelum jadwal', pct: 75 },
  { min: 12, label: '12 – 24 jam sebelum jadwal', pct: 50 },
  { min: 0, label: '< 12 jam sebelum jadwal', pct: 0 },
];

export const refundFor = (hours: number) =>
  REFUND_RULES.find((r) => hours >= r.min) ?? REFUND_RULES[REFUND_RULES.length - 1];

export const ADMIN_FEE = 5000;

export const rescheduleFee = (hours: number) => {
  if (hours >= 24) return 0;
  if (hours >= 12) return 0.1;
  return 0.25;
};

export const DP_PCT = 0.3;

export const bookingCode = () =>
  'LP-' +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  String(Math.floor(Math.random() * 90) + 10);

export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
