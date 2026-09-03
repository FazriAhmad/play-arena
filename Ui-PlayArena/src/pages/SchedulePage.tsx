import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BOOKING_STATUS_LABELS, type Booking, type BookingStatus, type OwnerVenueDetail } from '../lib/types';
import { useVenue } from '../store/VenueContext';
import { Badge, Card, Field, Input } from '../components/ui';

/** Status yang benar-benar memakai slot — rejected/cancelled tidak muncul di jadwal karena slotnya sudah lepas lagi. */
const OCCUPYING: BookingStatus[] = ['menunggu_acc', 'menunggu_bayar', 'confirmed', 'completed'];

const SLOT_STYLE: Record<string, string> = {
  menunggu_acc: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  menunggu_bayar: 'bg-[#1d5fc4]/20 text-[#7ab0f0] border-[#1d5fc4]/40',
  confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  completed: 'bg-slate-700/40 text-slate-300 border-slate-600',
};

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'success' | 'danger'> = {
  menunggu_acc: 'neutral',
  menunggu_bayar: 'neutral',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  completed: 'success',
};

const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const hourOf = (iso: string) => new Date(iso).getHours();
const customerName = (b: Booking) => b.pelanggan?.name ?? (b.guest_name ? `${b.guest_name} (walk-in)` : '—');

/** Jadwal harian per venue — baris lapangan × kolom jam, dipakai admin/staff lihat lapangan mana terisi jam berapa. */
export default function SchedulePage() {
  const { venues, currentVenueId, setCurrentVenueId, loading: venuesLoading } = useVenue();
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [venue, setVenue] = useState<OwnerVenueDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentVenueId) {
      setVenue(null);
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get<{ data: OwnerVenueDetail }>(`/manage/venues/${currentVenueId}`),
      api.get<{ data: Booking[] }>(`/manage/bookings?venue_id=${currentVenueId}&date=${date}`),
    ])
      .then(([venueRes, bookingRes]) => {
        setVenue(venueRes.data);
        setBookings(bookingRes.data.filter((b) => OCCUPYING.includes(b.status)));
      })
      .finally(() => setLoading(false));
  }, [currentVenueId, date]);

  const activeCourts = venue?.courts.filter((c) => c.is_active) ?? [];
  const hours = venue ? Array.from({ length: venue.close_hour - venue.open_hour }, (_, i) => venue.open_hour + i) : [];
  const sorted = [...bookings].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Jadwal Lapangan</h1>
      <p className="mt-1 text-sm text-slate-400">
        Lapangan mana terisi jam berapa pada tanggal terpilih. Booking yang ditolak/dibatalkan tidak ditampilkan.
      </p>

      {venuesLoading ? (
        <p className="mt-6 text-sm text-slate-500">Memuat…</p>
      ) : venues.length === 0 ? (
        <Card className="mt-6 p-6">
          <p className="text-sm text-slate-300">Belum ada venue.</p>
        </Card>
      ) : (
        <>
          {venues.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVenueId(v.id)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    v.id === currentVenueId
                      ? 'border-[#1d5fc4] bg-[#1d5fc4]/10 text-[#1d5fc4]'
                      : 'border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          <Card className="mt-4 flex flex-wrap items-end gap-3 p-4">
            <Field label="Tanggal" className="w-44">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center gap-3 pb-1 text-xs text-slate-400">
              {(['menunggu_acc', 'menunggu_bayar', 'confirmed', 'completed'] as const).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`inline-block h-3 w-3 rounded border ${SLOT_STYLE[s]}`} />
                  {BOOKING_STATUS_LABELS[s]}
                </span>
              ))}
            </div>
          </Card>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Memuat jadwal…</p>
          ) : !venue ? null : activeCourts.length === 0 ? (
            <Card className="mt-6 p-6">
              <p className="text-sm text-slate-300">Venue ini belum punya lapangan aktif.</p>
            </Card>
          ) : (
            <>
              <Card className="mt-6 overflow-x-auto p-4">
                <table className="w-full border-separate border-spacing-1 text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-slate-900 pr-2 text-left font-semibold text-slate-400">Lapangan</th>
                      {hours.map((h) => (
                        <th key={h} className="min-w-[52px] font-medium text-slate-500">
                          {String(h).padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCourts.map((court) => (
                      <CourtRow key={court.id} courtId={court.id} courtName={court.name} bookings={bookings} hours={hours} />
                    ))}
                  </tbody>
                </table>
              </Card>

              <h2 className="mt-8 text-lg font-bold text-white">Rincian Booking Hari Itu</h2>
              {sorted.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Tidak ada booking pada tanggal ini.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {sorted.map((b) => (
                    <Card key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <div>
                        <span className="font-semibold text-white">
                          {new Date(b.starts_at).toLocaleTimeString('id-ID', { timeStyle: 'short' })}–
                          {new Date(b.ends_at).toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                        </span>
                        <span className="ml-2 text-slate-300">{b.court?.name}</span>
                        <span className="ml-2 text-slate-400">· {customerName(b)}</span>
                        {b.contact_wa && <span className="ml-2 text-xs text-slate-500">{b.contact_wa}</span>}
                      </div>
                      <Badge tone={STATUS_TONE[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Satu baris lapangan: booking dirender sebagai satu sel melebar (colSpan) sepanjang durasinya, bukan sel per jam. */
function CourtRow({
  courtId,
  courtName,
  bookings,
  hours,
}: {
  courtId: number;
  courtName: string;
  bookings: Booking[];
  hours: number[];
}) {
  const cells: { key: string; span: number; booking?: Booking }[] = [];
  const openHour = hours[0];
  const closeHour = hours[hours.length - 1] + 1;

  let h = openHour;
  while (h < closeHour) {
    const booking = bookings.find(
      (b) => b.court_id === courtId && hourOf(b.starts_at) <= h && hourOf(b.ends_at) > h,
    );
    if (booking) {
      const span = Math.min(hourOf(booking.ends_at), closeHour) - h;
      cells.push({ key: `b-${booking.id}-${h}`, span, booking });
      h += span;
    } else {
      cells.push({ key: `f-${h}`, span: 1 });
      h += 1;
    }
  }

  return (
    <tr>
      <td className="sticky left-0 z-10 whitespace-nowrap bg-slate-900 pr-2 font-medium text-slate-200">{courtName}</td>
      {cells.map((cell) =>
        cell.booking ? (
          <td key={cell.key} colSpan={cell.span}>
            <div
              className={`truncate rounded border px-1.5 py-1.5 text-center font-medium ${SLOT_STYLE[cell.booking.status]}`}
              title={`${customerName(cell.booking)} · ${BOOKING_STATUS_LABELS[cell.booking.status]}`}
            >
              {customerName(cell.booking)}
            </div>
          </td>
        ) : (
          <td key={cell.key}>
            <div className="h-8 rounded border border-slate-800 bg-slate-950" />
          </td>
        ),
      )}
    </tr>
  );
}
