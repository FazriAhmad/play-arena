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
  /** Modul 20 — cuma dipakai lapangan badminton, null = venue ini tidak jual shuttlecock. */
  shuttlecock_price: number | null;
  photo_url: string | null;
  facilities: string[] | null;
  is_active: boolean;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
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
  rating_avg: number | null;
  reviews_count: number;
}

/** Halaman detail venue (GET /venues/:id). */
export interface VenueDetail {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  admin_wa: string | null;
  lat: number | null;
  lng: number | null;
  open_hour: number;
  close_hour: number;
  courts: Court[];
  /** Modul 21 — cuma ada kalau owner venue ini punya plan membership aktif. */
  membership: {
    price: number;
    discount_percent: number;
    badminton_quota_hours_per_week: number | null;
    badminton_quota_sessions_per_month: number | null;
  } | null;
}

/** Daftar venue yang bisa dikelola user login (GET /manage/venues) — owner: miliknya; staff: yang ditugaskan. */
export interface OwnerVenue {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  admin_wa: string | null;
  /** Modul 06 (sementara, sambil menunggu Midtrans) — info transfer manual & QRIS milik venue. */
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  qris_image_url: string | null;
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

export interface Refund {
  id: number;
  amount: number;
  status: 'entitled' | 'forfeited' | 'processed';
  reason: string;
  processed_at: string | null;
}

/** Hasil booking (POST /courts/:id/bookings, GET /bookings/mine, GET /manage/bookings) — Modul 05 & 07. */
export interface Booking {
  id: number;
  court_id: number;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  reject_reason: string | null;
  cancel_reason: string | null;
  contact_wa: string;
  guest_name: string | null;
  created_at: string;
  court?: Court & {
    venue?: {
      id: number;
      name: string;
      address?: string | null;
      city?: string | null;
      admin_wa?: string | null;
      open_hour?: number;
      close_hour?: number;
      bank_name?: string | null;
      bank_account_number?: string | null;
      bank_account_holder?: string | null;
      qris_image_url?: string | null;
    };
  };
  pelanggan?: { id: number; name: string; phone: string } | null;
  payments?: Payment[];
  refunds?: Refund[];
  review?: Review | null;
  promo_code?: string | null;
  discount_amount?: number | null;
  shuttlecock_qty: number;
  shuttlecock_amount: number;
  member_discount_amount: number;
}

/** Ulasan lapangan (GET /courts/:id/reviews, POST /bookings/:id/review) — Modul 13. */
export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  pelanggan?: { id: number; name: string };
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
  is_member: boolean;
  membership_expires_at: string | null;
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

export const DAYS_OF_WEEK = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Hasil booking berulang (POST /courts/:id/recurring-bookings) — Modul 11. */
export interface RecurringBookingResult {
  recurring_group_id: number;
  created: Booking[];
  failed: { date: string; reason: string }[];
}

/** Voucher & kode promo (GET/POST/PUT/DELETE /manage/promos) — Modul 14. */
export interface Promo {
  id: number;
  venue_id: number | null;
  venue?: { id: number; name: string } | null;
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_amount: number | null;
  quota: number | null;
  used_count: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

/** Hasil cek voucher sebelum booking (POST /courts/:id/promos/preview) — Modul 14. */
export interface PromoPreview {
  discount_amount: number;
  final_amount: number;
}

/** Basis pelanggan Owner (GET /manage/customers) — Modul 15. */
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_member: boolean;
  membership_expires_at: string | null;
  bookings_count: number;
  total_spent: number;
  last_booking_at: string | null;
}

/** Plan membership bulanan (GET/POST /manage/membership-plan) — Modul 21. */
export interface MembershipPlan {
  price: number;
  discount_percent: number;
  is_active: boolean;
  /** Kuota booking badminton GRATIS per minggu/bulan, opsional — null berdua = tidak ada kuota. */
  badminton_quota_hours_per_week: number | null;
  badminton_quota_sessions_per_month: number | null;
}

/** Detail pelanggan + riwayat booking (GET /manage/customers/:id) — Modul 15. */
export interface CustomerDetail extends Customer {
  bookings: Booking[];
}

/** Pengumuman (GET /announcements publik, GET/POST/PUT/DELETE /manage/announcements) — Modul 16. */
export interface Announcement {
  id: number;
  title: string;
  body: string;
  target_segment: 'all' | 'venue' | 'member';
  venue_id: number | null;
  venue?: { id: number; name: string } | null;
  is_active: boolean;
  created_at: string;
}

export const TARGET_SEGMENT_LABELS: Record<Announcement['target_segment'], string> = {
  all: 'Semua pelanggan',
  venue: 'Pernah booking venue tertentu',
  member: 'Member saja',
};

export const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

/** Dashboard analitik (GET /manage/analytics?venue_id=) — Modul 18. */
export interface AnalyticsData {
  heatmap: { day_of_week: number; hour: number; count: number }[];
  top_courts: { court_id: number; name: string; bookings_count: number }[];
  trend: { date: string; count: number }[];
  occupancy_rate: number;
}

export const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Laporan pendapatan (GET /manage/revenue?venue_id=&from=&to=) — Modul 19. */
export interface RevenueReport {
  from: string;
  to: string;
  summary: { gross: number; refunded: number; net: number; transactions_count: number };
  daily: { date: string; gross: number; refunded: number; net: number }[];
  by_court: { court_id: number; name: string; gross: number; transactions_count: number }[];
  by_method: { method: string; gross: number; transactions_count: number }[];
}
