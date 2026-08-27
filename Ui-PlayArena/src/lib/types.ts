export type Role = 'owner' | 'staff' | 'pelanggan';

/** Venue ringkas, dipakai untuk dropdown penugasan staff (GET /venues/mine). */
export interface Venue {
  id: number;
  name: string;
  city: string | null;
}

export interface Court {
  id: number;
  venue_id: number;
  name: string;
  sport: string;
  price_per_hour: number;
  photo_url: string | null;
  facilities: string[] | null;
  is_active: boolean;
}

/** Kartu di direktori publik (GET /venues). */
export interface VenueSummary {
  id: number;
  name: string;
  city: string | null;
  cover: string | null;
  sports: string[];
  price_from: number | null;
  courts_count: number;
}

/** Halaman detail venue (GET /venues/:id). */
export interface VenueDetail {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  open_hour: number;
  close_hour: number;
  courts: Court[];
}

/** Daftar venue milik owner untuk dikelola (GET /owner/venues) — termasuk yang nonaktif. */
export interface OwnerVenue {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  open_hour: number;
  close_hour: number;
  is_active: boolean;
  courts_count: number;
}

/** Detail venue untuk form edit owner (GET /owner/venues/:id) — semua lapangan. */
export interface OwnerVenueDetail extends Omit<OwnerVenue, 'courts_count'> {
  courts: Court[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: Role;
  venue_ids: number[];
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  venues: Venue[];
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner / Admin',
  staff: 'Staff / Kasir',
  pelanggan: 'Pelanggan',
};

export const SPORTS = ['Futsal', 'Bulu Tangkis', 'Basket', 'Tenis', 'Voli', 'Tenis Meja', 'Renang'];

export const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
