export type SportType =
  | 'Futsal'
  | 'Bulu Tangkis'
  | 'Basket'
  | 'Tenis'
  | 'Voli'
  | 'Tenis Meja'
  | 'Renang';

export const SPORTS: SportType[] = [
  'Futsal',
  'Bulu Tangkis',
  'Basket',
  'Tenis',
  'Voli',
  'Tenis Meja',
  'Renang',
];

export interface Venue {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  cover: string;
  facilities: string[];
  openHour: number;
  closeHour: number;
  description: string;
  active: boolean;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  sport: SportType;
  pricePerHour: number;
  image: string;
  facilities: string[];
  indoor: boolean;
  surface: string;
  active: boolean;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type PaymentStatus =
  | 'unpaid'
  | 'awaiting_verification'
  | 'dp_paid'
  | 'paid'
  | 'refunded';

export interface SplitShare {
  name: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
  method?: string;
}

export interface ExtraItem {
  name: string;
  qty: number;
  price: number;
}

export interface LogEntry {
  at: string;
  action: string;
  by: string;
}

export interface Booking {
  id: string;
  code: string;
  venueId: string;
  courtId: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  durationHours: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMode: 'dp' | 'full';
  paymentMethod?: string;
  subtotal: number;
  extrasTotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  refundAmount?: number;
  voucherCode?: string;
  splitWith: SplitShare[];
  extras: ExtraItem[];
  recurring: boolean;
  recurringGroupId?: string;
  notes?: string;
  createdAt: string;
  remindersSent: string[];
  review?: { stars: number; comment: string; at: string };
  logs: LogEntry[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  tier: 'non-member' | 'bronze' | 'silver' | 'gold';
  membershipUntil?: string;
  city: string;
}

export interface Voucher {
  code: string;
  type: 'percent' | 'nominal';
  value: number;
  minSpend: number;
  description: string;
  active: boolean;
  quota: number;
  used: number;
  expiresAt: string;
}

export type StaffRole = 'owner' | 'admin' | 'kasir' | 'staff';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  venueIds: string[];
  active: boolean;
  joinedAt: string;
}

export interface BlockSlot {
  id: string;
  courtId: string;
  date: string;
  startHour: number;
  durationHours: number;
  reason: string;
}

export interface NotificationLog {
  id: string;
  channel: 'whatsapp' | 'email' | 'push';
  to: string;
  subject: string;
  body: string;
  at: string;
  kind: 'booking' | 'reminder' | 'payment' | 'broadcast' | 'system';
  status: 'sent' | 'delivered' | 'read';
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'member' | 'inactive' | 'venue-customers';
  channels: ('whatsapp' | 'email' | 'push')[];
  venueId?: string;
  sentAt: string;
  recipients: number;
  opened: number;
}

export interface Review {
  id: string;
  venueId: string;
  courtId: string;
  customerName: string;
  stars: number;
  comment: string;
  at: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  perks: string[];
  discountPct: number;
  color: string;
}

export interface AppUser {
  role: 'customer' | StaffRole;
  name: string;
  customerId?: string;
  staffId?: string;
  venueIds: string[];
}

export interface AppState {
  venues: Venue[];
  courts: Court[];
  bookings: Booking[];
  customers: Customer[];
  vouchers: Voucher[];
  staff: Staff[];
  blocks: BlockSlot[];
  notifications: NotificationLog[];
  broadcasts: Broadcast[];
  reviews: Review[];
  liveHolds: { courtId: string; date: string; startHour: number; at: string }[];
  user: AppUser;
}
