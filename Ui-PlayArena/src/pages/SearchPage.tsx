import { MapPin, SlidersHorizontal, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { rupiah, SPORTS, type VenueSummary } from '../lib/types';
import { Badge, Card, Field, Input } from '../components/ui';

export default function SearchPage() {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (city) params.set('city', city);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);

    setLoading(true);
    const handle = setTimeout(() => {
      api
        .get<{ data: VenueSummary[] }>(`/venues?${params.toString()}`)
        .then((res) => setVenues(res.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [sport, city, minPrice, maxPrice]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Cari Lapangan</h1>
      <p className="mt-1 text-sm text-slate-500">Booking online, tanpa perlu telepon dulu untuk cek jadwal.</p>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <SlidersHorizontal size={14} /> Filter
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Jenis olahraga">
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
            >
              <option value="">Semua</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kota">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="mis. Jakarta Selatan" />
          </Field>
          <Field label="Harga min /jam">
            <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Harga maks /jam">
            <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="500000" />
          </Field>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="col-span-full text-center text-sm text-slate-400">Memuat…</p>}
        {!loading && venues.length === 0 && (
          <p className="col-span-full text-center text-sm text-slate-400">Tidak ada venue yang cocok dengan filter ini.</p>
        )}
        {venues.map((v) => (
          <Link key={v.id} to={`/venue/${v.id}`}>
            <Card className="h-full overflow-hidden transition hover:shadow-md">
              <div className="flex h-32 items-center justify-center bg-slate-100 text-slate-300">
                {v.cover ? (
                  <img src={v.cover} alt={v.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs">Belum ada foto</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{v.name}</h3>
                  {v.rating_avg !== null && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600">
                      <Star size={12} fill="currentColor" /> {v.rating_avg} ({v.reviews_count})
                    </span>
                  )}
                </div>
                {v.city && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} /> {v.city}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {v.sports.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold text-[#1d5fc4]">
                  {v.price_from ? `Mulai ${rupiah(v.price_from)}/jam` : 'Harga belum tersedia'}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
