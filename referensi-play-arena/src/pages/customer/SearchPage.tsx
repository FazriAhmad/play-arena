import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListFilter, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { SPORTS } from '../../lib/types';
import { rupiah } from '../../lib/utils';
import { Badge, Button, EmptyState } from '../../components/ui';
import { CourtCard } from '../../components/VenueCards';

const MAX_PRICE = 350000;

export const SearchPage = () => {
  const { state, venueRating } = useStore();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const sport = params.get('sport') ?? '';
  const city = params.get('city') ?? '';
  const minRating = Number(params.get('rating') ?? 0);
  const maxPrice = Number(params.get('price') ?? MAX_PRICE);
  const sort = params.get('sort') ?? 'popular';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const cities = Array.from(new Set(state.venues.map((v) => v.city)));

  const results = useMemo(() => {
    let list = state.courts
      .filter((c) => c.active)
      .map((c) => ({
        court: c,
        venue: state.venues.find((v) => v.id === c.venueId)!,
        rating: venueRating(c.venueId),
      }))
      .filter((x) => x.venue);

    if (sport) list = list.filter((x) => x.court.sport === sport);
    if (city) list = list.filter((x) => x.venue.city === city);
    if (minRating) list = list.filter((x) => x.rating.avg >= minRating || x.rating.count === 0);
    list = list.filter((x) => x.court.pricePerHour <= maxPrice);

    if (sort === 'price-asc') list.sort((a, b) => a.court.pricePerHour - b.court.pricePerHour);
    else if (sort === 'price-desc') list.sort((a, b) => b.court.pricePerHour - a.court.pricePerHour);
    else if (sort === 'rating') list.sort((a, b) => b.rating.avg - a.rating.avg);

    return list;
  }, [state.courts, state.venues, sport, city, minRating, maxPrice, sort, venueRating]);

  const activeFilterCount = [sport, city, minRating > 0, maxPrice < MAX_PRICE].filter(Boolean).length;

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">Jenis Olahraga</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam('sport', '')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              !sport ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/55'
            }`}
          >
            Semua
          </button>
          {SPORTS.map((s) => (
            <button
              key={s}
              onClick={() => setParam('sport', sport === s ? '' : s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                sport === s ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/55'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">Lokasi / Kota</p>
        <select
          value={city}
          onChange={(e) => setParam('city', e.target.value)}
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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-white/45">Harga Maksimal</p>
          <span className="text-xs font-bold text-neon-300">{rupiah(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={50000}
          max={MAX_PRICE}
          step={5000}
          value={maxPrice}
          onChange={(e) => setParam('price', e.target.value)}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/35">
          <span>Rp50rb</span>
          <span>Rp350rb+</span>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">Rating Minimal</p>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setParam('rating', String(r))}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                minRating === r ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/55'
              }`}
            >
              {r === 0 ? 'Semua' : `${r}+ ★`}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setParams(new URLSearchParams())}>
          <X size={14} /> Reset semua filter
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Cari Lapangan</h1>
          <p className="mt-1 text-sm text-white/50">{results.length} lapangan ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="rounded-xl border border-white/12 bg-ink-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-neon-400/60"
          >
            <option value="popular">Paling Populer</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="price-asc">Harga Terendah</option>
            <option value="price-desc">Harga Tertinggi</option>
          </select>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 rounded-xl border border-white/12 px-3.5 py-2.5 text-sm font-semibold text-white/70 lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filter
            {activeFilterCount > 0 && <Badge tone="neon">{activeFilterCount}</Badge>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="glass sticky top-24 rounded-2xl p-5">
            <p className="mb-5 flex items-center gap-2 font-display text-sm font-bold text-white">
              <ListFilter size={16} className="text-neon-400" /> Filter Pencarian
            </p>
            {FilterPanel}
          </div>
        </aside>

        {showFilters && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowFilters(false)} />
            <div className="glass-strong relative ml-auto h-full w-80 overflow-y-auto p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-sm font-bold">Filter</p>
                <button onClick={() => setShowFilters(false)}>
                  <X size={18} />
                </button>
              </div>
              {FilterPanel}
              <Button className="mt-6 w-full" onClick={() => setShowFilters(false)}>
                Terapkan Filter
              </Button>
            </div>
          </div>
        )}

        <div>
          {results.length === 0 ? (
            <EmptyState
              icon={<MapPin size={22} />}
              title="Tidak ada lapangan yang cocok"
              description="Coba ubah filter jenis olahraga, lokasi, harga, atau rating minimal."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ court, venue, rating }) => (
                <CourtCard key={court.id} court={court} venue={venue} rating={rating} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
