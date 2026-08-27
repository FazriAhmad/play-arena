import { Link } from 'react-router-dom';
import { MapPin, Users, Zap } from 'lucide-react';
import type { Court, Venue } from '../lib/types';
import { rupiah } from '../lib/utils';
import { Badge, Card, Stars } from './ui';

export const CourtCard = ({
  court,
  venue,
  rating,
}: {
  court: Court;
  venue: Venue;
  rating: { avg: number; count: number };
}) => (
  <Card hover className="group overflow-hidden">
    <Link to={`/lapangan/${court.id}`} className="block">
      <div className="relative h-44 overflow-hidden">
        <img
          src={court.image}
          alt={court.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
        <Badge tone="neon" className="absolute left-3 top-3 backdrop-blur">
          {court.sport}
        </Badge>
        {court.indoor && (
          <Badge tone="info" className="absolute right-3 top-3 backdrop-blur">
            Indoor
          </Badge>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-medium text-white/85">
            <MapPin size={12} /> {venue.district}, {venue.city}
          </span>
          {rating.count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-amber-300 backdrop-blur">
              ★ {rating.avg} <span className="text-white/50">({rating.count})</span>
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="truncate font-display text-base font-bold text-white">{court.name}</h3>
        </div>
        <p className="mb-3 truncate text-xs text-white/45">{venue.name}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {court.facilities.slice(0, 3).map((f) => (
            <span key={f} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/8 pt-3">
          <div>
            <span className="font-display text-lg font-extrabold text-neon-300">
              {rupiah(court.pricePerHour)}
            </span>
            <span className="text-xs text-white/40"> /jam</span>
          </div>
          <span className="flex items-center gap-1 rounded-lg bg-neon-400/10 px-3 py-1.5 text-xs font-bold text-neon-300 transition group-hover:bg-neon-400 group-hover:text-ink-950">
            <Zap size={13} /> Booking
          </span>
        </div>
      </div>
    </Link>
  </Card>
);

export const VenueCard = ({
  venue,
  courtCount,
  rating,
  minPrice,
}: {
  venue: Venue;
  courtCount: number;
  rating: { avg: number; count: number };
  minPrice: number;
}) => (
  <Card hover className="group overflow-hidden">
    <Link to={`/venue/${venue.id}`} className="flex flex-col sm:flex-row">
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-auto sm:w-56">
        <img
          src={venue.cover}
          alt={venue.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 sm:bg-gradient-to-r" />
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-white">{venue.name}</h3>
            {rating.count > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-300">
                <Stars value={rating.avg} size={12} /> {rating.avg}
              </span>
            )}
          </div>
          <p className="mb-2 flex items-center gap-1 text-xs text-white/45">
            <MapPin size={12} /> {venue.address}
          </p>
          <p className="mb-3 line-clamp-2 text-sm text-white/50">{venue.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {venue.facilities.slice(0, 4).map((f) => (
              <span key={f} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
          <span className="flex items-center gap-1.5 text-xs text-white/50">
            <Users size={13} /> {courtCount} lapangan tersedia
          </span>
          <div className="text-right">
            <span className="text-[10px] text-white/40">Mulai dari</span>
            <p className="font-display text-base font-extrabold text-neon-300">{rupiah(minPrice)}/jam</p>
          </div>
        </div>
      </div>
    </Link>
  </Card>
);
