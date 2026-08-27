import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { BOOKING_STATUS_LABELS, rupiah, type Booking, type BookingStatus } from '../lib/types';
import { Badge, Button, Card } from '../components/ui';

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'success' | 'danger'> = {
  menunggu_acc: 'neutral',
  menunggu_bayar: 'neutral',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  completed: 'success',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  manual: 'Transfer Manual',
  midtrans: 'Midtrans',
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ data: Booking }>(`/bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-400">Memuat…</p>;
  if (error || !booking) return <p className="text-sm text-slate-400">Booking tidak ditemukan.</p>;

  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const hours = Math.round((end.getTime() - start.getTime()) / 3_600_000);
  const total = booking.court ? booking.court.price_per_hour * hours : 0;
  const payment = booking.payments?.[0];
  const invoiceNo = `INV-PA-${String(booking.id).padStart(6, '0')}`;
  const canShowInvoice = booking.status === 'confirmed' || booking.status === 'completed';

  return (
    <div>
      <Link to="/bookings" className="text-sm font-medium text-[#1d5fc4] hover:underline print:hidden">
        ← Kembali ke Booking Saya
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Detail Booking</h1>
        {canShowInvoice && (
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer size={16} /> Cetak / Simpan Invoice PDF
          </Button>
        )}
      </div>

      <Card className="mt-4 p-6 print:border-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d5fc4] font-bold text-sm text-white">P</div>
            <span className="font-bold text-slate-900">PlayArena</span>
          </div>
          <Badge tone={STATUS_TONE[booking.status]}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
        </div>

        {canShowInvoice && (
          <p className="mt-4 text-xs font-mono text-slate-400">No. Invoice: {invoiceNo}</p>
        )}
        {booking.status === 'rejected' && booking.reject_reason && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            Alasan ditolak: {booking.reject_reason}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Venue &amp; Lapangan</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{booking.court?.venue?.name}</p>
            <p className="text-sm text-slate-600">{booking.court?.name} ({booking.court?.sport})</p>
            {booking.court?.venue?.address && <p className="mt-0.5 text-xs text-slate-500">{booking.court.venue.address}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jadwal</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-slate-600">
              {start.toLocaleTimeString('id-ID', { timeStyle: 'short' })}–{end.toLocaleTimeString('id-ID', { timeStyle: 'short' })} ({hours} jam)
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rincian Harga</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {rupiah(booking.court?.price_per_hour ?? 0)}/jam × {hours} jam
            </span>
            <span className="font-semibold text-slate-900">{rupiah(total)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-[#1d5fc4]">{rupiah(total)}</span>
          </div>
          {payment && (
            <p className="mt-2 text-xs text-slate-500">
              Dibayar via {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
              {payment.confirmed_at && ` · ${new Date(payment.confirmed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`}
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kontak</p>
          <p className="mt-1 text-sm text-slate-600">{booking.contact_wa}</p>
        </div>
      </Card>
    </div>
  );
}
