import { Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { rupiah, type VenueDetail } from '../lib/types';
import VenueMap from '../components/VenueMap';
import { Badge, Card } from '../components/ui';

export default function VenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
