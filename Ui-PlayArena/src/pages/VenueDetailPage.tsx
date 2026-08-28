import { Clock, MapPin, MessageCircle, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import {
  DAYS_OF_WEEK,
  rupiah,
  type Court,
  type PromoPreview,
  type RecurringBookingResult,
  type Review,
  type Slot,
  type VenueDetail,
} from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { buildBookingWaMessage, buildWaLink } from '../lib/whatsapp';
import SlotGrid from '../components/SlotGrid';
import VenueMap from '../components/VenueMap';
import { Badge, Button, Card, Field, Input, Stars } from '../components/ui';

function isActiveMember(user: { is_member: boolean; membership_expires_at: string | null } | null): boolean {
  return !!user?.is_member && !!user.membership_expires_at && new Date(user.membership_expires_at) > new Date();
}

export default function VenueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openCourtId, setOpenCourtId] = useState<number | null>(null);
  const [recurringCourtId, setRecurringCourtId] = useState<number | null>(null);
  const [reviewsCourtId, setReviewsCourtId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .get<{ data: VenueDetail }>(`/venues/${id}`)
      .then((res) => setVenue(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-400">Memuat…</p>;
  if (error || !venue) return <p className="text-sm text-slate-400">Venue tidak ditemukan.</p>;

  return (
    <div>
      <Link to="/" className="text-sm font-medium text-[#1d5fc4] hover:underline">
        ← Kembali ke pencarian
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">{venue.name}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        {venue.address && (
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {venue.address}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={14} /> {String(venue.open_hour).padStart(2, '0')}:00 – {String(venue.close_hour).padStart(2, '0')}:00
        </span>
      </div>

      {venue.membership && (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {isActiveMember(user) ? (
            <p>
              Anda member — otomatis dapat diskon <strong>{venue.membership.discount_percent}%</strong> di setiap booking.
            </p>
          ) : (
            <p>
              Jadi member {rupiah(venue.membership.price)}/bulan, dapat diskon <strong>{venue.membership.discount_percent}%</strong>{' '}
              di setiap booking. Hubungi admin venue lewat WhatsApp untuk daftar.
            </p>
          )}
        </Card>
      )}

      {venue.lat && venue.lng && (
        <Card className="mt-5 overflow-hidden p-1">
          <VenueMap lat={venue.lat} lng={venue.lng} name={venue.name} />
        </Card>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Lapangan Tersedia</h2>
      {venue.courts.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Belum ada lapangan terdaftar di venue ini.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4">
          {venue.courts.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge>{c.sport}</Badge>
                    {c.reviews_count ? (
                      <button
                        onClick={() => setReviewsCourtId((cur) => (cur === c.id ? null : c.id))}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline"
                      >
                        <Star size={12} fill="currentColor" /> {c.reviews_avg_rating?.toFixed(1)} ({c.reviews_count})
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada ulasan</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1d5fc4]">{rupiah(c.price_per_hour)}/jam</p>
                  {c.sport === 'Bulu Tangkis' && c.shuttlecock_price && (
                    <p className="text-xs text-slate-400">Shuttlecock {rupiah(c.shuttlecock_price)}/buah</p>
                  )}
                </div>
              </div>
              {c.facilities && c.facilities.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Fasilitas: {c.facilities.join(', ')}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  className="text-xs"
                  onClick={() => {
                    setOpenCourtId((cur) => (cur === c.id ? null : c.id));
                    setRecurringCourtId(null);
                  }}
                >
                  {openCourtId === c.id ? 'Tutup' : 'Booking Sekarang'}
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    setRecurringCourtId((cur) => (cur === c.id ? null : c.id));
                    setOpenCourtId(null);
                  }}
                >
                  {recurringCourtId === c.id ? 'Tutup' : 'Booking Berulang'}
                </Button>
              </div>
              {openCourtId === c.id && (
                <BookingPanel
                  court={c}
                  venueName={venue.name}
                  adminWa={venue.admin_wa}
                  venueCloseHour={venue.close_hour}
                  memberDiscountPercent={isActiveMember(user) ? (venue.membership?.discount_percent ?? null) : null}
                />
              )}
              {recurringCourtId === c.id && <RecurringBookingPanel court={c} venueCloseHour={venue.close_hour} />}
              {reviewsCourtId === c.id && <ReviewsList courtId={c.id} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function BookingPanel({
  court,
  venueName,
  adminWa,
  venueCloseHour,
  memberDiscountPercent,
}: {
  court: Court;
  venueName: string;
  adminWa: string | null;
  venueCloseHour: number;
  memberDiscountPercent: number | null;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [contactWa, setContactWa] = useState('');
  const [shuttlecockQty, setShuttlecockQty] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoPreview, setPromoPreview] = useState<PromoPreview | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSlots = () => {
    setSelectedHour(null);
    api.get<{ data: Slot[] }>(`/courts/${court.id}/slots?date=${date}`).then((res) => setSlots(res.data));
  };

  useEffect(loadSlots, [date, court.id]);
  useEffect(() => {
    setPromoPreview(null);
    setPromoError('');
  }, [duration, court.id]);

  const maxDurationFromHour = selectedHour === null ? 1 : venueCloseHour - selectedHour;
  const sellsShuttlecock = court.sport === 'Bulu Tangkis' && !!court.shuttlecock_price;
  const shuttlecockTotal = sellsShuttlecock ? shuttlecockQty * (court.shuttlecock_price ?? 0) : 0;
  const rentalSubtotal = court.price_per_hour * duration;
  const memberDiscount = memberDiscountPercent ? Math.round((rentalSubtotal * memberDiscountPercent) / 100) : 0;
  const total = rentalSubtotal + shuttlecockTotal - memberDiscount;

  const applyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const res = await api.post<{ data: PromoPreview }>(`/courts/${court.id}/promos/preview`, {
        code: promoCode,
        duration_hours: duration,
      });
      setPromoPreview(res.data);
    } catch (err) {
      setPromoPreview(null);
      setPromoError(err instanceof ApiError ? err.message : 'Gagal cek voucher.');
    } finally {
      setPromoLoading(false);
    }
  };

  const submit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (selectedHour === null) {
      setError('Pilih jam dulu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ data: { id: number } }>(`/courts/${court.id}/bookings`, {
        date,
        start_hour: selectedHour,
        duration_hours: duration,
        contact_wa: contactWa,
        promo_code: promoPreview ? promoCode : undefined,
        shuttlecock_qty: sellsShuttlecock ? shuttlecockQty : undefined,
      });
      setSuccess(true);

      if (adminWa) {
        const endHour = selectedHour + duration;
        const link = buildWaLink(
          adminWa,
          buildBookingWaMessage({
            customerName: user?.name ?? 'Pelanggan',
            venueName,
            courtName: court.name,
            date: new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            timeRange: `${String(selectedHour).padStart(2, '0')}:00–${String(endHour).padStart(2, '0')}:00`,
            bookingId: res.data.id,
          }),
        );
        setWaLink(link);
        window.open(link, '_blank');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat booking.');
      loadSlots();
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold">Booking berhasil dibuat — status: Menunggu ACC Admin.</p>
        <p className="mt-1 text-xs text-emerald-700">
          Slot Anda sudah terkunci sementara. Kirim konfirmasi ke admin lewat WhatsApp supaya cepat di-ACC. Cek status di{' '}
          <Link to="/bookings" className="font-semibold underline">
            Booking Saya
          </Link>
          .
        </p>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={14} /> Kirim Konfirmasi via WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <Field label="Tanggal">
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
      {sellsShuttlecock && (
        <Field label="Jumlah Shuttlecock (opsional)" hint={`${rupiah(court.shuttlecock_price ?? 0)}/buah`}>
          <Input
            type="number"
            min={0}
            max={50}
            value={shuttlecockQty}
            onChange={(e) => setShuttlecockQty(Math.max(0, Number(e.target.value)))}
            className="w-24"
          />
        </Field>
      )}
      <Field label="Kode Voucher (opsional)">
        <div className="flex gap-2">
          <Input
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase());
              setPromoPreview(null);
              setPromoError('');
            }}
            placeholder="AGUSTUS20"
            className="flex-1"
          />
          <Button variant="ghost" onClick={applyPromo} disabled={promoLoading || !promoCode} className="shrink-0">
            {promoLoading ? 'Cek…' : 'Terapkan'}
          </Button>
        </div>
        {promoError && <span className="mt-1 block text-xs font-medium text-rose-600">{promoError}</span>}
        {promoPreview && (
          <span className="mt-1 block text-xs font-medium text-emerald-600">
            Voucher diterapkan — hemat {rupiah(promoPreview.discount_amount)}
          </span>
        )}
      </Field>
      <Field label="Nomor WA yang bisa dihubungi" hint="Dipakai admin untuk konfirmasi manual">
        <Input value={contactWa} onChange={(e) => setContactWa(e.target.value)} placeholder="0812xxxxxxx" required />
      </Field>
      {selectedHour !== null && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>
              {rupiah(court.price_per_hour)}/jam × {duration} jam
            </span>
            <span>{rupiah(rentalSubtotal)}</span>
          </div>
          {shuttlecockQty > 0 && (
            <div className="mt-1 flex items-center justify-between text-slate-500">
              <span>Shuttlecock × {shuttlecockQty}</span>
              <span>{rupiah(shuttlecockTotal)}</span>
            </div>
          )}
          {memberDiscount > 0 && (
            <div className="mt-1 flex items-center justify-between text-emerald-600">
              <span>Diskon member ({memberDiscountPercent}%)</span>
              <span>-{rupiah(memberDiscount)}</span>
            </div>
          )}
          {promoPreview && (
            <div className="mt-1 flex items-center justify-between text-emerald-600">
              <span>Diskon voucher</span>
              <span>-{rupiah(promoPreview.discount_amount)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
            <span>Total</span>
            <span>{rupiah(promoPreview ? promoPreview.final_amount - memberDiscount + shuttlecockTotal : total)}</span>
          </div>
        </div>
      )}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
      <Button onClick={submit} disabled={loading || selectedHour === null || !contactWa}>
        {loading ? 'Memproses…' : user ? 'Booking Sekarang' : 'Login untuk Booking'}
      </Button>
    </div>
  );
}

/** Modul 11 — booking berulang (mis. tim futsal mingguan). Tiap sesi tunduk penuh pada Modul 05, sesi bentrok ditandai gagal, bukan seluruh rangkaian batal. */
function RecurringBookingPanel({ court, venueCloseHour }: { court: Court; venueCloseHour: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startHour, setStartHour] = useState('18');
  const [duration, setDuration] = useState('1');
  const [startsOn, setStartsOn] = useState(todayISO());
  const [mode, setMode] = useState<'until_date' | 'session_count'>('session_count');
  const [endsOn, setEndsOn] = useState(todayISO());
  const [sessionCount, setSessionCount] = useState('8');
  const [contactWa, setContactWa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecurringBookingResult | null>(null);

  const submit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ data: RecurringBookingResult }>(`/courts/${court.id}/recurring-bookings`, {
        day_of_week: dayOfWeek,
        start_hour: Number(startHour),
        duration_hours: Number(duration),
        starts_on: startsOn,
        contact_wa: contactWa,
        mode,
        ...(mode === 'until_date' ? { ends_on: endsOn } : { session_count: Number(sessionCount) }),
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat booking berulang.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold">
          {result.created.length} sesi berhasil dibuat{result.failed.length > 0 ? `, ${result.failed.length} sesi gagal` : ''}.
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Tiap sesi berstatus Menunggu ACC Admin. Cek semuanya di{' '}
          <Link to="/bookings" className="font-semibold underline">
            Booking Saya
          </Link>
          .
        </p>
        {result.failed.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-rose-700">
            {result.failed.map((f) => (
              <li key={f.date}>
                {new Date(f.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {f.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const maxDuration = Math.max(1, Math.min(4, venueCloseHour - Number(startHour)));

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hari">
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            {DAYS_OF_WEEK.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Jam mulai">
          <Input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(e.target.value)} />
        </Field>
        <Field label="Durasi (jam)">
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            {Array.from({ length: maxDuration }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {h} jam
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mulai tanggal">
          <Input type="date" value={startsOn} min={todayISO()} onChange={(e) => setStartsOn(e.target.value)} />
        </Field>
      </div>

      <Field label="Sampai kapan?">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input type="radio" checked={mode === 'session_count'} onChange={() => setMode('session_count')} />
            Jumlah sesi
          </label>
          {mode === 'session_count' && (
            <Input
              type="number"
              min={1}
              max={52}
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value)}
              className="w-24"
            />
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input type="radio" checked={mode === 'until_date'} onChange={() => setMode('until_date')} />
            Sampai tanggal
          </label>
          {mode === 'until_date' && (
            <Input type="date" value={endsOn} min={startsOn} onChange={(e) => setEndsOn(e.target.value)} className="w-auto" />
          )}
        </div>
      </Field>

      <Field label="Nomor WA yang bisa dihubungi">
        <Input value={contactWa} onChange={(e) => setContactWa(e.target.value)} placeholder="0812xxxxxxx" required />
      </Field>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
      <Button onClick={submit} disabled={loading || !contactWa}>
        {loading ? 'Memproses…' : user ? 'Buat Booking Berulang' : 'Login untuk Booking'}
      </Button>
    </div>
  );
}

/** Modul 13 — daftar ulasan publik per lapangan. */
function ReviewsList({ courtId }: { courtId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Review[] }>(`/courts/${courtId}/reviews`)
      .then((res) => setReviews(res.data))
      .finally(() => setLoading(false));
  }, [courtId]);

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      {loading && <p className="text-xs text-slate-400">Memuat ulasan…</p>}
      {!loading && reviews.length === 0 && <p className="text-xs text-slate-400">Belum ada ulasan.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">{r.pelanggan?.name ?? 'Pelanggan'}</span>
            <Stars value={r.rating} size={12} />
          </div>
          {r.comment && <p className="mt-1 text-xs text-slate-600">{r.comment}</p>}
          <p className="mt-1 text-[11px] text-slate-400">
            {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  );
}
