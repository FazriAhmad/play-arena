import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BOOKING_STATUS_LABELS, rupiah, type Booking } from '../lib/types';
import { Badge, Card } from '../components/ui';

const STATUS_TONE: Record<Booking['status'], 'neutral' | 'success' | 'danger'> = {
  menunggu_acc: 'neutral',
  menunggu_bayar: 'neutral',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  completed: 'success',
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Booking[] }>('/bookings/mine')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Booking Saya</h1>
      <p className="mt-1 text-sm text-slate-500">Riwayat &amp; status booking lapangan Anda.</p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-400">Memuat…</p>}
        {!loading && bookings.length === 0 && <p className="text-sm text-slate-400">Belum ada booking.</p>}
        {bookings.map((b) => {
          const start = new Date(b.starts_at);
          const end = new Date(b.ends_at);
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {b.court?.venue?.name} — {b.court?.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                    {start.toLocaleTimeString('id-ID', { timeStyle: 'short' })}–{end.toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                  </p>
                  {b.court && <p className="mt-1 text-xs font-semibold text-[#1d5fc4]">{rupiah(b.court.price_per_hour)}/jam</p>}
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
