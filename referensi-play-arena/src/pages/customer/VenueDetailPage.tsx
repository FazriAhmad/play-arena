import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { rupiah } from '../../lib/utils';
import { Badge, Button, Card, SectionHeading, Stars, Tabs } from '../../components/ui';
import { CourtCard } from '../../components/VenueCards';

export const VenueDetailPage = () => {
  const { id } = useParams();
  const { state, venueRating } = useStore();
  const [tab, setTab] = useState<'lapangan' | 'fasilitas' | 'ulasan' | 'lokasi'>('lapangan');

  const venue = state.venues.find((v) => v.id === id);
  const courts = useMemo(() => state.courts.filter((c) => c.venueId === id && c.active), [state.courts, id]);
  const reviews = useMemo(() => state.reviews.filter((r) => r.venueId === id), [state.reviews, id]);
  const rating = venueRating(id ?? '');

  if (!venue) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-2xl font-bold text-white">Venue tidak ditemukan</p>
        <Link to="/cari" className="mt-4 inline-block text-neon-400">
          Kembali cari lapangan
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        <img src={venue.cover} className="h-full w-full object-cover" alt={venue.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
      </div>

      <div className="mx-auto -mt-20 max-w-7xl px-4 pb-16 sm:px-6">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {Array.from(new Set(courts.map((c) => c.sport))).map((s) => (
                  <Badge key={s} tone="neon">
                    {s}
                  </Badge>
                ))}
              </div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{venue.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/50">
                <MapPin size={15} /> {venue.address}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                {rating.count > 0 ? (
                  <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <Stars value={rating.avg} /> {rating.avg} ({rating.count} ulasan)
                  </span>
                ) : (
                  <span className="text-white/40">Belum ada ulasan</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> Buka {String(venue.openHour).padStart(2, '0')}:00 – {String(venue.closeHour).padStart(2, '0')}:00
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${venue.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button variant="subtle">
                  <Phone size={15} /> Hubungi Venue
                </Button>
              </a>
              <a
                href={`https://www.google.com/maps?q=${venue.lat},${venue.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline">
                  <Navigation size={15} /> Rute
                </Button>
              </a>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/55">{venue.description}</p>

          <div className="mt-6">
            <Tabs
              tabs={[
                { id: 'lapangan', label: `Lapangan (${courts.length})` },
                { id: 'fasilitas', label: 'Fasilitas' },
                { id: 'ulasan', label: `Ulasan (${reviews.length})` },
                { id: 'lokasi', label: 'Lokasi' },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
        </Card>

        <div className="mt-8">
          {tab === 'lapangan' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courts.map((c) => (
                <CourtCard key={c.id} court={c} venue={venue} rating={rating} />
              ))}
            </div>
          )}

          {tab === 'fasilitas' && (
            <Card className="p-6">
              <SectionHeading eyebrow="Selengkapnya" title="Fasilitas venue" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {venue.facilities.map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/70">
                    <ShieldCheck size={15} className="text-neon-400" /> {f}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'ulasan' && (
            <div className="space-y-4">
              {reviews.length === 0 && <p className="text-sm text-white/45">Belum ada ulasan untuk venue ini.</p>}
              {reviews.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{r.customerName}</p>
                    <Stars value={r.stars} />
                  </div>
                  <p className="mt-2 text-sm text-white/60">{r.comment}</p>
                  <p className="mt-2 text-xs text-white/35">
                    {state.courts.find((c) => c.id === r.courtId)?.name}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {tab === 'lokasi' && (
            <Card className="overflow-hidden p-0">
              <div className="relative h-80 w-full bg-ink-900">
                <iframe
                  title="map"
                  className="h-full w-full grayscale invert-[0.92] contrast-[1.1]"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.lng - 0.01}%2C${
                    venue.lat - 0.01
                  }%2C${venue.lng + 0.01}%2C${venue.lat + 0.01}&layer=mapnik&marker=${venue.lat}%2C${venue.lng}`}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold text-white">{venue.address}</p>
                  <p className="text-xs text-white/45">
                    {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
                  </p>
                </div>
                <a href={`https://www.google.com/maps?q=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <Navigation size={14} /> Buka di Google Maps
                  </Button>
                </a>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
