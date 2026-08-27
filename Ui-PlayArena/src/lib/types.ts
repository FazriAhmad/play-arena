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

/** Daftar venue yang bisa dikelola user login (GET /manage/venues) — owner: miliknya; staff: yang ditugaskan. */
export interface OwnerVenue {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  open_hour: number;
  close_hour: number;
  booking_hold_minutes: number;
  is_active: boolean;
  courts_count: number;
}

/** Detail venue untuk dikelola (GET /manage/venues/:id) — semua lapangan. */
export interface OwnerVenueDetail extends Omit<OwnerVenue, 'courts_count'> {
  courts: Court[];
}

/** Slot ketersediaan per jam (GET /courts/:id/slots) — Modul 04. */
export interface Slot {
  hour: number;
  state: 'available' | 'booked' | 'blocked' | 'past';
  label: string;
}

/** Blokir manual (GET/POST /manage/courts/:id/blocked-slots) — Modul 04. */
export interface BlockedSlot {
  id: number;
  court_id: number;
  starts_at: string;
  ends_at: string;
  reason: string;
}

export type BookingStatus = 'menunggu_acc' | 'menunggu_bayar' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Payment {
  id: number;
  method: 'manual' | 'midtrans';
  amount: number;
  status: string;
  reference: string | null;
  confirmed_at: string | null;
}

/** Hasil booking (POST /courts/:id/bookings, GET /bookings/mine, GET /manage/bookings) — Modul 05 & 07. */
export interface Booking {
  id: number;
  court_id: number;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  reject_reason: string | null;
  contact_wa: string;
  guest_name: string | null;
  court?: Court & { venue?: { id: number; name: string; address?: string | null; city?: string | null } };
  pelanggan?: { id: number; name: string; phone: string } | null;
  payments?: Payment[];
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  menunggu_acc: 'Menunggu ACC Admin',
  menunggu_bayar: 'Menunggu Pembayaran',
  confirmed: 'Terkonfirmasi',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};

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
