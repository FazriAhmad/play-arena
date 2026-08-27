import { Clock, MapPin, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { rupiah, type Court, type Slot, type VenueDetail } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { buildBookingWaMessage, buildWaLink } from '../lib/whatsapp';
import SlotGrid from '../components/SlotGrid';
import VenueMap from '../components/VenueMap';
import { Badge, Button, Card, Field, Input } from '../components/ui';

export default function VenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openCourtId, setOpenCourtId] = useState<number | null>(null);

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
                  <Badge>{c.sport}</Badge>
                </div>
                <p className="text-sm font-bold text-[#1d5fc4]">{rupiah(c.price_per_hour)}/jam</p>
              </div>
              {c.facilities && c.facilities.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Fasilitas: {c.facilities.join(', ')}</p>
              )}
              <Button
                className="mt-3 text-xs"
                onClick={() => setOpenCourtId((cur) => (cur === c.id ? null : c.id))}
              >
                {openCourtId === c.id ? 'Tutup' : 'Booking Sekarang'}
              </Button>
              {openCourtId === c.id && (
                <BookingPanel court={c} venueName={venue.name} adminWa={venue.admin_wa} venueCloseHour={venue.close_hour} />
              )}
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
}: {
  court: Court;
  venueName: string;
  adminWa: string | null;
  venueCloseHour: number;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [contactWa, setContactWa] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSlots = () => {
    setSelectedHour(null);
    api.get<{ data: Slot[] }>(`/courts/${court.id}/slots?date=${date}`).then((res) => setSlots(res.data));
  };

  useEffect(loadSlots, [date, court.id]);

  const maxDurationFromHour = selectedHour === null ? 1 : venueCloseHour - selectedHour;

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
      <Field label="Nomor WA yang bisa dihubungi" hint="Dipakai admin untuk konfirmasi manual">
        <Input value={contactWa} onChange={(e) => setContactWa(e.target.value)} placeholder="0812xxxxxxx" required />
      </Field>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
      <Button onClick={submit} disabled={loading || selectedHour === null || !contactWa}>
        {loading ? 'Memproses…' : user ? 'Booking Sekarang' : 'Login untuk Booking'}
      </Button>
    </div>
  );
}
