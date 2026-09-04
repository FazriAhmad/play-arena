import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { BOOKING_STATUS_LABELS, rupiah, type Booking, type BookingStatus } from '../lib/types';
import { Badge, Card } from '../components/ui';
import { cn } from '../lib/utils';

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'success' | 'danger'> = {
  menunggu_acc: 'neutral',
  menunggu_bayar: 'neutral',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  completed: 'success',
};

type Tab = 'akan_datang' | 'selesai' | 'dibatalkan';

const TABS: { key: Tab; label: string }[] = [
  { key: 'akan_datang', label: 'Akan Datang' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'dibatalkan', label: 'Dibatalkan' },
];

const bucketOf = (b: Booking): Tab => {
  if (b.status === 'rejected' || b.status === 'cancelled') return 'dibatalkan';
  if (b.status === 'completed') return 'selesai';

  return 'akan_datang';
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('akan_datang');

  useEffect(() => {
    api
      .get<{ data: Booking[] }>('/bookings/mine')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => bucketOf(b) === tab);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Booking Saya</h1>
      <p className="mt-1 text-sm text-slate-400">Riwayat &amp; status booking lapangan Anda.</p>

      <div className="mt-5 flex gap-1 rounded-lg bg-slate-800 p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 font-semibold transition',
              tab === t.key ? 'bg-slate-900 text-[#1d5fc4] shadow-sm' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-500">Memuat…</p>}
        {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">Tidak ada booking di kategori ini.</p>}
        {filtered.map((b) => {
          const start = new Date(b.starts_at);
          const end = new Date(b.ends_at);
          return (
            <Link key={b.id} to={`/bookings/${b.id}`}>
              <Card className="p-4 transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {b.court?.venue?.name} — {b.court?.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                      {start.toLocaleTimeString('id-ID', { timeStyle: 'short' })}–{end.toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                    </p>
                    {b.court && <p className="mt-1 text-xs font-semibold text-[#1d5fc4]">{rupiah(b.court.price_per_hour)}/jam</p>}
                  </div>
                  <Badge tone={STATUS_TONE[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
