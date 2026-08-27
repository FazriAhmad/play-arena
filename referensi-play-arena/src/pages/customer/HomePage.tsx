import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BellRing,
  CalendarClock,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Split,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { useStore, useLiveAvailability } from '../../store/StoreContext';
import { SPORTS } from '../../lib/types';
import { SPORT_IMAGE } from '../../data/seed';
import { Badge, Button, Card, SectionHeading, Stars } from '../../components/ui';
import { CourtCard, VenueCard } from '../../components/VenueCards';
import { todayISO, addDays, fmtDateShort } from '../../lib/utils';

const FEATURES = [
  {
    icon: Activity,
    title: 'Ketersediaan Real-Time',
    desc: 'Kalender slot kosong/terisi live — tidak ada lagi booking ganda atau bentrok jadwal.',
  },
  {
    icon: RefreshCcw,
    title: 'Booking Berulang Otomatis',
    desc: 'Set sekali untuk main tiap Senin jam 8 malam — sistem auto-booking & auto-ingatkan tiap minggu.',
  },
  {
    icon: Split,
    title: 'Split Payment Rame-Rame',
    desc: 'Bagi tagihan ke semua anggota tim, masing-masing bayar bagiannya sendiri via link.',
  },
  {
    icon: ShieldCheck,
    title: 'Refund Transparan',
    desc: 'Kebijakan cancel & reschedule jelas berdasarkan H-berapa jam sebelum jadwal main.',
  },
  {
    icon: BellRing,
    title: 'Reminder H-1 Otomatis',
    desc: 'Notifikasi WhatsApp & email otomatis sehari sebelum jadwal supaya kamu tidak lupa main.',
  },
  {
    icon: Ticket,
    title: 'Voucher & Membership',
    desc: 'Kumpulkan diskon dari kode promo dan nikmati harga khusus sebagai member bulanan.',
  },
];

export const HomePage = () => {
  const { state, venueRating } = useStore();
  const navigate = useNavigate();
  const [sport, setSport] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState(todayISO());
  const liveEvents = useLiveAvailability(true);

  const featuredCourts = useMemo(
    () =>
      state.courts
        .filter((c) => c.active)
        .slice()
        .sort(() => 0.5 - Math.random())
        .slice(0, 8),
    [state.courts],
  );

  const topVenues = useMemo(() => {
    return state.venues
      .map((v) => ({
        venue: v,
        courtCount: state.courts.filter((c) => c.venueId === v.id).length,
        rating: venueRating(v.id),
        minPrice: Math.min(...state.courts.filter((c) => c.venueId === v.id).map((c) => c.pricePerHour)),
      }))
      .sort((a, b) => b.rating.avg - a.rating.avg)
      .slice(0, 3);
  }, [state.venues, state.courts, venueRating]);

  const cities = Array.from(new Set(state.venues.map((v) => v.city)));

  const doSearch = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (city) params.set('city', city);
    if (date) params.set('date', date);
    navigate(`/cari?${params.toString()}`);
  };

  const recentReviews = state.reviews.slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24">
        <div className="animate-float-slow pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-aqua-400/15 blur-3xl" />
        <div className="animate-float-slow pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-neon-400/15 blur-3xl" style={{ animationDelay: '2s' }} />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge tone="neon" className="mb-5">
                <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-neon-400" /> 214 slot dibooking hari ini
              </Badge>
              <h1 className="font-display text-4xl font-black leading-[1.06] text-white sm:text-6xl">
                Booking lapangan <span className="neon-text">tanpa drama</span> bentrok jadwal.
              </h1>
              <p className="mt-5 max-w-lg text-base text-white/55 sm:text-lg">
                Cari, bandingkan, dan booking futsal, bulu tangkis, basket, tenis, voli hingga kolam renang — real-time, transparan, bisa split bayar rame-rame.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3">
                {[
                  ['5', 'Venue mitra'],
                  ['14', 'Jenis lapangan'],
                  ['4.8', 'Rating rata-rata'],
                ].map(([n, l]) => (
                  <div key={l}>
                    <p className="font-display text-2xl font-black text-white">{n}</p>
                    <p className="text-xs text-white/45">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="relative overflow-hidden p-5 sm:p-6">
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-white/80">
                <MapPin size={16} className="text-neon-400" /> Cari lapangan sekarang
              </p>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Jenis Olahraga</p>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {SPORTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSport(sport === s ? '' : s)}
                        className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2 transition ${
                          sport === s ? 'border-neon-400 bg-neon-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                        }`}
                      >
                        <img src={SPORT_IMAGE[s]} className="h-8 w-8 rounded-lg object-cover" alt={s} />
                        <span className="text-[10px] font-semibold text-white/70">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Lokasi</p>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-white/12 bg-ink-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-neon-400/60"
                    >
                      <option value="">Semua Kota</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Tanggal</p>
                    <input
                      type="date"
                      value={date}
                      min={todayISO()}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-white/12 bg-ink-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-neon-400/60"
                    />
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={doSearch}>
                  Cari Lapangan Sekarang
                </Button>
              </div>

              {liveEvents.length > 0 && (
                <div className="mt-4 space-y-1.5 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" /> Live Activity
                  </p>
                  {liveEvents.map((e, i) => (
                    <p key={i} className="truncate text-[11px] text-white/50">
                      {e}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* SPORTS QUICK GRID */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {SPORTS.map((s) => (
            <button
              key={s}
              onClick={() => navigate(`/cari?sport=${encodeURIComponent(s)}`)}
              className="group relative flex h-32 w-44 shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-4 text-left"
            >
              <img src={SPORT_IMAGE[s]} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" alt={s} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
              <span className="relative font-display text-sm font-bold text-white">{s}</span>
              <span className="relative text-[11px] text-white/60">
                {state.courts.filter((c) => c.sport === s).length} lapangan
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED COURTS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeading
          eyebrow="Pilihan Terbaik"
          title="Lapangan populer minggu ini"
          description="Dipilih berdasarkan rating, lokasi strategis, dan tingkat okupansi tertinggi."
          right={
            <Button variant="outline" onClick={() => navigate('/cari')}>
              Lihat semua
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCourts.map((c) => (
            <CourtCard
              key={c.id}
              court={c}
              venue={state.venues.find((v) => v.id === c.venueId)!}
              rating={venueRating(c.venueId)}
            />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-white/8 bg-white/[0.015] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Kenapa LapakLapangan"
            title="Semua yang kamu butuhkan untuk main tanpa ribet"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-5">
                <div className="mb-4 inline-flex rounded-xl border border-neon-400/25 bg-neon-400/10 p-2.5 text-neon-300">
                  <f.icon size={20} />
                </div>
                <h3 className="mb-1.5 font-display text-base font-bold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TOP VENUES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Venue Unggulan" title="Multi-lapangan dalam satu venue" description="Satu tempat, banyak pilihan lapangan — booking sekaligus untuk acara komunitas." />
        <div className="grid grid-cols-1 gap-5">
          {topVenues.map(({ venue, courtCount, rating, minPrice }) => (
            <VenueCard key={venue.id} venue={venue} courtCount={courtCount} rating={rating} minPrice={minPrice} />
          ))}
        </div>
      </section>

      {/* TESTIMONIALS TICKER */}
      <section className="overflow-hidden border-y border-white/8 bg-white/[0.015] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Kata Mereka" title="Rating & review pemain" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentReviews.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <Stars value={r.stars} />
                  <span className="text-[11px] text-white/35">{fmtDateShort(r.at)}</span>
                </div>
                <p className="text-sm leading-relaxed text-white/65">“{r.comment}”</p>
                <p className="mt-3 text-xs font-semibold text-white/45">
                  {r.customerName} · {state.venues.find((v) => v.id === r.venueId)?.name}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Card className="relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-neon-400/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-aqua-300">
                <TrendingUp size={14} /> Punya lapangan sendiri?
              </p>
              <h3 className="max-w-lg font-display text-2xl font-bold text-white sm:text-3xl">
                Kelola venue, booking, dan pendapatanmu dalam satu dashboard.
              </h3>
            </div>
            <Button size="lg" variant="aqua" onClick={() => navigate('/admin')}>
              <CalendarClock size={18} /> Buka Dashboard Admin
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};
