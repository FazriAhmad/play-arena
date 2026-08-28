import { MessageCircle, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { BOOKING_STATUS_LABELS, rupiah, type Booking, type BookingStatus, type Slot } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { buildBookingWaMessage, buildWaLink } from '../lib/whatsapp';
import { Badge, Button, Card, Field, Input, Stars } from '../components/ui';
import SlotGrid from '../components/SlotGrid';

const REFUND_STATUS_LABELS: Record<string, string> = {
  entitled: 'Refund penuh — menunggu diproses admin',
  processed: 'Refund sudah diproses',
  forfeited: 'Tidak ada refund (hangus)',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const load = () => {
    api
      .get<{ data: Booking }>(`/bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setShowReschedule(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancelBooking = async () => {
    const reason = prompt('Alasan pembatalan (opsional):') ?? undefined;
    if (!confirm('Yakin batalkan booking ini?')) return;
    await api.post(`/bookings/${id}/cancel`, { reason: reason || undefined });
    load();
  };

  if (loading) return <p className="text-sm text-slate-400">Memuat…</p>;
  if (error || !booking) return <p className="text-sm text-slate-400">Booking tidak ditemukan.</p>;

  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const hours = Math.round((end.getTime() - start.getTime()) / 3_600_000);
  const total = booking.court ? booking.court.price_per_hour * hours : 0;
  const payment = booking.payments?.[0];
  const refund = booking.refunds?.[0];
  const invoiceNo = `INV-PA-${String(booking.id).padStart(6, '0')}`;
  const canShowInvoice = booking.status === 'confirmed' || booking.status === 'completed';
  const canCancel = ['menunggu_acc', 'menunggu_bayar', 'confirmed'].includes(booking.status);
  const canReschedule = ['menunggu_acc', 'menunggu_bayar'].includes(booking.status);

  const minutesSinceCreated = (Date.now() - new Date(booking.created_at).getTime()) / 60_000;
  const showChatAdmin = booking.status === 'menunggu_acc' && minutesSinceCreated >= 10 && !!booking.court?.venue?.admin_wa;
  const chatAdminLink = showChatAdmin
    ? buildWaLink(
        booking.court!.venue!.admin_wa!,
        buildBookingWaMessage({
          customerName: user?.name ?? 'Pelanggan',
          venueName: booking.court!.venue!.name,
          courtName: booking.court!.name,
          date: start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          timeRange: `${start.toLocaleTimeString('id-ID', { timeStyle: 'short' })}–${end.toLocaleTimeString('id-ID', { timeStyle: 'short' })}`,
          bookingId: booking.id,
        }),
      )
    : null;

  return (
    <div>
      <Link to="/bookings" className="text-sm font-medium text-[#1d5fc4] hover:underline print:hidden">
        ← Kembali ke Booking Saya
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Detail Booking</h1>
        <div className="flex flex-wrap gap-2">
          {canReschedule && (
            <Button variant="ghost" onClick={() => setShowReschedule((v) => !v)}>
              {showReschedule ? 'Tutup Form' : 'Jadwal Ulang'}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={cancelBooking}>
              Batalkan Booking
            </Button>
          )}
          {canShowInvoice && (
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer size={16} /> Cetak / Simpan Invoice PDF
            </Button>
          )}
        </div>
      </div>

      {showReschedule && booking.court && (
        <RescheduleForm
          bookingId={booking.id}
          courtId={booking.court_id}
          venueCloseHour={booking.court.venue?.close_hour ?? 24}
          contactWa={booking.contact_wa}
          onDone={(newId) => navigate(`/bookings/${newId}`)}
        />
      )}

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
        {showChatAdmin && chatAdminLink && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 print:hidden">
            <p className="text-xs font-medium text-amber-700">
              Belum di-ACC admin? Follow up langsung lewat WhatsApp.
            </p>
            <a
              href={chatAdminLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
            >
              <MessageCircle size={14} /> Chat Admin via WhatsApp
            </a>
          </div>
        )}
        {booking.status === 'rejected' && booking.reject_reason && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            Alasan ditolak: {booking.reject_reason}
          </p>
        )}
        {booking.status === 'cancelled' && (
          <div className="mt-4 space-y-2">
            {booking.cancel_reason && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                Alasan dibatalkan: {booking.cancel_reason}
              </p>
            )}
            {refund && (
              <p className={`rounded-lg px-3 py-2 text-xs font-medium ${refund.amount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
                {REFUND_STATUS_LABELS[refund.status] ?? refund.status}
                {refund.amount > 0 && ` — ${rupiah(refund.amount)}`}
              </p>
            )}
          </div>
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
          {booking.shuttlecock_qty > 0 && (
            <div className="mt-1 flex items-center justify-between text-sm text-slate-600">
              <span>Shuttlecock × {booking.shuttlecock_qty}</span>
              <span>{rupiah(booking.shuttlecock_amount)}</span>
            </div>
          )}
          {!!booking.member_discount_amount && (
            <div className="mt-1 flex items-center justify-between text-sm text-emerald-600">
              <span>Diskon member</span>
              <span>-{rupiah(booking.member_discount_amount)}</span>
            </div>
          )}
          {!!booking.discount_amount && (
            <div className="mt-1 flex items-center justify-between text-sm text-emerald-600">
              <span>Diskon voucher {booking.promo_code}</span>
              <span>-{rupiah(booking.discount_amount)}</span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-[#1d5fc4]">
              {rupiah(total + booking.shuttlecock_amount - (booking.discount_amount ?? 0) - booking.member_discount_amount)}
            </span>
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

      {booking.status === 'completed' && <ReviewSection booking={booking} onSubmitted={load} />}
    </div>
  );
}

/** Modul 13 — beri ulasan (cuma booking completed, satu review per booking). */
function ReviewSection({ booking, onSubmitted }: { booking: Booking; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (booking.review) {
    return (
      <Card className="mt-4 p-5 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ulasan Anda</p>
        <div className="mt-2">
          <Stars value={booking.review.rating} />
        </div>
        {booking.review.comment && <p className="mt-2 text-sm text-slate-600">{booking.review.comment}</p>}
      </Card>
    );
  }

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post(`/bookings/${booking.id}/review`, { rating, comment: comment || undefined });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim ulasan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 space-y-3 p-5 print:hidden">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beri Ulasan Lapangan Ini</p>
      <Stars value={rating} onChange={setRating} size={22} />
      <Field label="Komentar (opsional)">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Bagaimana pengalaman main Anda?"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
        />
      </Field>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
      <Button onClick={submit} disabled={loading}>
        {loading ? 'Mengirim…' : 'Kirim Ulasan'}
      </Button>
    </Card>
  );
}

/** Modul 09 — pindah booking (belum dibayar) ke slot lain, tunduk penuh pada Modul 05 (grid & validasi server yang sama). */
function RescheduleForm({
  bookingId,
  courtId,
  venueCloseHour,
  contactWa: defaultContactWa,
  onDone,
}: {
  bookingId: number;
  courtId: number;
  venueCloseHour: number;
  contactWa: string;
  onDone: (newBookingId: number) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [contactWa, setContactWa] = useState(defaultContactWa);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedHour(null);
    api.get<{ data: Slot[] }>(`/courts/${courtId}/slots?date=${date}`).then((res) => setSlots(res.data));
  }, [date, courtId]);

  const maxDurationFromHour = selectedHour === null ? 1 : venueCloseHour - selectedHour;

  const submit = async () => {
    if (selectedHour === null) {
      setError('Pilih jam dulu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ data: { id: number } }>(`/bookings/${bookingId}/reschedule`, {
        date,
        start_hour: selectedHour,
        duration_hours: duration,
        contact_wa: contactWa,
      });
      onDone(res.data.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menjadwalkan ulang.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 space-y-3 p-5 print:hidden">
      <Field label="Tanggal baru">
        <Input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </Field>
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Pilih Jam</span>
        <SlotGrid slots={slots} selectedHour={selectedHour} onSelectHour={setSelectedHour} />
      </div>
      {selectedHour !== null && (
        <Field label="Durasi (jam)">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-auto rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            {Array.from({ length: Math.max(1, Math.min(4, maxDurationFromHour)) }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {h} jam
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Nomor WA yang bisa dihubungi">
        <Input value={contactWa} onChange={(e) => setContactWa(e.target.value)} placeholder="0812xxxxxxx" required />
      </Field>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
      <Button onClick={submit} disabled={loading || selectedHour === null || !contactWa}>
        {loading ? 'Memproses…' : 'Simpan Jadwal Baru'}
      </Button>
    </Card>
  );
}
