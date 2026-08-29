import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { BOOKING_STATUS_LABELS, rupiah, type Booking, type BookingStatus, type OwnerVenue, type OwnerVenueDetail } from '../lib/types';
import { Badge, Button, Card, Field, Input } from '../components/ui';

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'success' | 'danger'> = {
  menunggu_acc: 'neutral',
  menunggu_bayar: 'neutral',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  completed: 'success',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [showWalkIn, setShowWalkIn] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (date) params.set('date', date);
    api
      .get<{ data: Booking[] }>(`/manage/bookings?${params}`)
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, date]);

  const accept = async (id: number) => {
    await api.post(`/manage/bookings/${id}/accept`, {});
    load();
  };

  const reject = async (id: number) => {
    const reason = prompt('Alasan penolakan (wajib diisi):');
    if (!reason) return;
    await api.post(`/manage/bookings/${id}/reject`, { reason });
    load();
  };

  const confirmPayment = async (id: number) => {
    if (!confirm('Konfirmasi pembayaran sudah diterima (transfer manual)?')) return;
    await api.post(`/manage/bookings/${id}/confirm-payment`, {});
    load();
  };

  const cancelBooking = async (id: number) => {
    const reason = prompt('Alasan pembatalan (wajib diisi):');
    if (!reason) return;
    await api.post(`/manage/bookings/${id}/cancel`, { reason });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Masuk</h1>
          <p className="mt-1 text-sm text-slate-400">ACC/tolak booking, konfirmasi pembayaran manual, atau input booking walk-in.</p>
        </div>
        <Button onClick={() => setShowWalkIn((v) => !v)}>
          <Plus size={16} /> {showWalkIn ? 'Tutup Form' : 'Booking Walk-in'}
        </Button>
      </div>

      {showWalkIn && (
        <WalkInForm
          onCreated={() => {
            setShowWalkIn(false);
            load();
          }}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-auto rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
        >
          <option value="">Semua status</option>
          {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-500">Memuat…</p>}
        {!loading && bookings.length === 0 && <p className="text-sm text-slate-500">Tidak ada booking.</p>}
        {bookings.map((b) => {
          const start = new Date(b.starts_at);
          const end = new Date(b.ends_at);
          return (
            <Card key={b.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">
                    {b.court?.venue?.name} — {b.court?.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {b.pelanggan?.name ?? `${b.guest_name} (walk-in)`} · {b.contact_wa}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                    {start.toLocaleTimeString('id-ID', { timeStyle: 'short' })}–{end.toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                  </p>
                  {b.court && <p className="mt-1 text-xs font-semibold text-[#1d5fc4]">{rupiah(b.court.price_per_hour)}/jam</p>}
                  {b.shuttlecock_qty > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">+ Shuttlecock × {b.shuttlecock_qty} ({rupiah(b.shuttlecock_amount)})</p>
                  )}
                  {b.member_discount_amount > 0 && (
                    <p className="mt-0.5 text-xs text-emerald-400">Diskon member -{rupiah(b.member_discount_amount)}</p>
                  )}
                  {b.status === 'rejected' && b.reject_reason && (
                    <p className="mt-1 text-xs text-rose-400">Alasan: {b.reject_reason}</p>
                  )}
                  {b.status === 'cancelled' && b.cancel_reason && (
                    <p className="mt-1 text-xs text-slate-400">Alasan dibatalkan: {b.cancel_reason}</p>
                  )}
                  {b.status === 'cancelled' && b.refunds?.[0] && b.refunds[0].amount > 0 && (
                    <p className="mt-1 text-xs font-semibold text-amber-400">
                      Refund {rupiah(b.refunds[0].amount)} — {b.refunds[0].status === 'processed' ? 'sudah diproses' : 'menunggu diproses'}
                    </p>
                  )}
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
              </div>

              {b.status === 'menunggu_acc' && (
                <div className="mt-3 flex gap-3 border-t border-slate-800 pt-3">
                  <button onClick={() => accept(b.id)} className="text-xs font-semibold text-emerald-400 hover:underline">
                    ACC Booking
                  </button>
                  <button onClick={() => reject(b.id)} className="text-xs font-semibold text-rose-400 hover:underline">
                    Tolak
                  </button>
                  <button onClick={() => cancelBooking(b.id)} className="text-xs font-semibold text-slate-400 hover:underline">
                    Batalkan
                  </button>
                </div>
              )}
              {b.status === 'menunggu_bayar' && (
                <div className="mt-3 flex gap-3 border-t border-slate-800 pt-3">
                  <button onClick={() => confirmPayment(b.id)} className="text-xs font-semibold text-emerald-400 hover:underline">
                    Konfirmasi Pembayaran Diterima
                  </button>
                  <button onClick={() => cancelBooking(b.id)} className="text-xs font-semibold text-slate-400 hover:underline">
                    Batalkan
                  </button>
                </div>
              )}
              {b.status === 'confirmed' && (
                <div className="mt-3 border-t border-slate-800 pt-3">
                  <button onClick={() => cancelBooking(b.id)} className="text-xs font-semibold text-slate-400 hover:underline">
                    Batalkan
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function WalkInForm({ onCreated }: { onCreated: () => void }) {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [venueId, setVenueId] = useState('');
  const [courts, setCourts] = useState<OwnerVenueDetail['courts']>([]);
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [startHour, setStartHour] = useState('8');
  const [duration, setDuration] = useState('1');
  const [guestName, setGuestName] = useState('');
  const [contactWa, setContactWa] = useState('');
  const [shuttlecockQty, setShuttlecockQty] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCourt = courts.find((c) => String(c.id) === courtId);
  const sellsShuttlecock = selectedCourt?.sport === 'Bulu Tangkis' && !!selectedCourt.shuttlecock_price;

  useEffect(() => {
    api.get<{ data: OwnerVenue[] }>('/manage/venues').then((res) => setVenues(res.data));
  }, []);

  useEffect(() => {
    setCourtId('');
    if (!venueId) {
      setCourts([]);
      return;
    }
    api.get<{ data: OwnerVenueDetail }>(`/manage/venues/${venueId}`).then((res) => setCourts(res.data.courts));
  }, [venueId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtId) {
      setError('Pilih lapangan dulu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`/manage/courts/${courtId}/bookings/walk-in`, {
        date,
        start_hour: Number(startHour),
        duration_hours: Number(duration),
        guest_name: guestName,
        contact_wa: contactWa,
        shuttlecock_qty: sellsShuttlecock && shuttlecockQty ? Number(shuttlecockQty) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah booking walk-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Venue">
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
            required
          >
            <option value="">Pilih venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lapangan">
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
            disabled={!venueId}
            required
          >
            <option value="">Pilih lapangan…</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.sport})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal">
          <Input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Jam mulai">
          <Input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(e.target.value)} />
        </Field>
        <Field label="Durasi (jam)">
          <Input type="number" min={1} max={12} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        {sellsShuttlecock && (
          <Field label="Jumlah Shuttlecock" hint={`${rupiah(selectedCourt!.shuttlecock_price!)}/buah, opsional`}>
            <Input type="number" min={0} max={50} value={shuttlecockQty} onChange={(e) => setShuttlecockQty(e.target.value)} />
          </Field>
        )}
        <Field label="Nama pelanggan">
          <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nama yang datang" required />
        </Field>
        <Field label="Nomor WA" className="sm:col-span-2">
          <Input value={contactWa} onChange={(e) => setContactWa(e.target.value)} placeholder="0812xxxxxxx" required />
        </Field>

        {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Booking (Lunas di Tempat)'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
