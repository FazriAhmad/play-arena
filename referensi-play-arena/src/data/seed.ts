import type {
  AppState,
  Booking,
  Court,
  Customer,
  NotificationLog,
  Review,
  SportType,
  Staff,
  Venue,
  Voucher,
  MembershipPlan,
  Broadcast,
} from '../lib/types';
import { addDays, bookingCode, todayISO, toISO } from '../lib/utils';

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(20260214);
const randInt = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

export const SPORT_IMAGE: Record<SportType, string> = {
  Futsal: '/images/futsal.jpg',
  'Bulu Tangkis': '/images/badminton.jpg',
  Basket: '/images/basket.jpg',
  Tenis: '/images/tennis.jpg',
  Voli: '/images/volley.jpg',
  'Tenis Meja': '/images/tenismeja.jpg',
  Renang: '/images/pool.jpg',
};

export const VENUE_COVER: Record<string, string> = {
  v1: '/images/futsal.jpg',
  v2: '/images/badminton.jpg',
  v3: '/images/basket.jpg',
  v4: '/images/tennis.jpg',
  v5: '/images/pool.jpg',
};

export const FACILITIES = [
  'Rumput sintetis',
  'Lampu LED',
  'AC',
  'Kamar ganti',
  'Toilet',
  'Locker',
  'Parkir luas',
  'Wifi gratis',
  'Kantin',
  'Tribun penonton',
  'Scoreboard digital',
  'Sound system',
  'Sewa perlengkapan',
  'Air minum gratis',
  'CCTV',
  'Musholla',
];

export const EXTRAS = [
  { name: 'Sewa Bola Match', price: 25000 },
  { name: 'Sewa Raket Pro', price: 15000 },
  { name: 'Sewa Sepatu Indoor', price: 20000 },
  { name: 'Jersey Tim (set)', price: 60000 },
  { name: 'Shuttlecock A+', price: 12000 },
  { name: 'Handuk + Air Mineral', price: 8000 },
];

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'bronze',
    name: 'Bronze Member',
    price: 149000,
    discountPct: 5,
    perks: ['Diskon 5% semua lapangan', 'Reminder WhatsApp otomatis', 'Akses voucher member'],
    color: 'from-amber-500/20 to-amber-500/5 border-amber-400/30',
  },
  {
    id: 'silver',
    name: 'Silver Member',
    price: 299000,
    discountPct: 10,
    perks: [
      'Diskon 10% semua lapangan',
      'Prioritas booking jam prime time',
      '1x reschedule gratis / bulan',
      'Gratis sewa bola 4x / bulan',
    ],
    color: 'from-slate-300/20 to-slate-300/5 border-slate-200/30',
  },
  {
    id: 'gold',
    name: 'Gold Member',
    price: 499000,
    discountPct: 15,
    perks: [
      'Diskon 15% semua lapangan',
      'Slot eksklusif 1 hari sebelum buka umum',
      'Reschedule unlimited gratis',
      'Gratis sewa perlengkapan 8x / bulan',
      'Free 1 jam tiap akhir bulan',
    ],
    color: 'from-lime-300/20 to-emerald-400/5 border-lime-300/30',
  },
];

export const PAYMENT_METHODS = [
  { id: 'va-bca', label: 'Virtual Account BCA', icon: '🏦', fee: 0 },
  { id: 'va-mandiri', label: 'Virtual Account Mandiri', icon: '🏛️', fee: 0 },
  { id: 'gopay', label: 'GoPay', icon: '🟢', fee: 0 },
  { id: 'ovo', label: 'OVO', icon: '🟣', fee: 1000 },
  { id: 'qris', label: 'QRIS (semua e-wallet)', icon: '🔳', fee: 0 },
  { id: 'card', label: 'Kartu Kredit / Debit', icon: '💳', fee: 2500 },
];

const venues: Venue[] = [
  {
    id: 'v1',
    name: 'Arena Senayan Futsal Club',
    city: 'Jakarta Selatan',
    district: 'Senayan',
    address: 'Jl. Asia Afrika No. 8, Gelora, Senayan, Jakarta Selatan',
    phone: '+6281211002201',
    lat: -6.2189,
    lng: 106.8016,
    cover: '/images/futsal.jpg',
    facilities: ['Rumput sintetis', 'Lampu LED', 'Tribun penonton', 'Kamar ganti', 'Toilet', 'Parkir luas', 'Wifi gratis', 'Kantin', 'Scoreboard digital', 'Musholla'],
    openHour: 8,
    closeHour: 24,
    description:
      'Venue futsal premium di jantung Senayan dengan 3 lapangan internasional, rumput sintetis FIFA Quality, dan tribun penonton. Lokasi strategis, mudah diakses dari MRT.',
    active: true,
  },
  {
    id: 'v2',
    name: 'GOR Manggarai Raya',
    city: 'Jakarta Timur',
    district: 'Manggarai',
    address: 'Jl. Minangkabau Selatan No. 21, Manggarai, Jakarta Timur',
    phone: '+6281211002202',
    lat: -6.2095,
    lng: 106.8571,
    cover: '/images/badminton.jpg',
    facilities: ['AC', 'Lampu LED', 'Kamar ganti', 'Locker', 'Parkir luas', 'Wifi gratis', 'Kantin', 'Air minum gratis', 'CCTV'],
    openHour: 7,
    closeHour: 23,
    description:
      'GOR bulu tangkis legendaris di Jakarta Timur. Lantai karbon internasional, sirkulasi udara terbaik, dan coach tersedia untuk private lesson.',
    active: true,
  },
  {
    id: 'v3',
    name: 'Hoops Center Kelapa Gading',
    city: 'Jakarta Utara',
    district: 'Kelapa Gading',
    address: 'Jl. Boulevard Raya Blok Q, Kelapa Gading, Jakarta Utara',
    phone: '+6281211002203',
    lat: -6.1583,
    lng: 106.9305,
    cover: '/images/basket.jpg',
    facilities: ['Lampu LED', 'Scoreboard digital', 'Sound system', 'Kamar ganti', 'Toilet', 'Parkir luas', 'Kantin', 'Tribun penonton'],
    openHour: 9,
    closeHour: 22,
    description:
      'Pusat basket indoor dengan lantai maple standar NBA, ring dapat diatur ketinggian, dan rental ball boy untuk latihan tim.',
    active: true,
  },
  {
    id: 'v4',
    name: 'Smash Arena BSD',
    city: 'Tangerang Selatan',
    district: 'BSD City',
    address: 'Ruko De Park BSD Sector 7, Tangerang Selatan',
    phone: '+6281211002204',
    lat: -6.3010,
    lng: 106.6685,
    cover: '/images/tennis.jpg',
    facilities: ['Lampu LED', 'AC', 'Kamar ganti', 'Locker', 'Parkir luas', 'Wifi gratis', 'Sewa perlengkapan', 'CCTV'],
    openHour: 8,
    closeHour: 22,
    description:
      'Venue tenis & voli modern di BSD dengan 2 lapangan tenis hardcourt dan 2 lapangan voli indoor bantalan empuk.',
    active: true,
  },
  {
    id: 'v5',
    name: 'Aqua Lanes Kemang',
    city: 'Jakarta Selatan',
    district: 'Kemang',
    address: 'Jl. Kemang Raya No. 88, Jakarta Selatan',
    phone: '+6281211002205',
    lat: -6.2607,
    lng: 106.8137,
    cover: '/images/pool.jpg',
    facilities: ['Lampu LED', 'Kamar ganti', 'Locker', 'Toilet', 'Air minum gratis', 'CCTV', 'Kantin'],
    openHour: 6,
    closeHour: 21,
    description:
      'Kolam standar kompetisi 8 lintasan dengan air sistem filtrasi ganda. Tersedia coach bersertifikat dan program renang pagi.',
    active: true,
  },
];

const courtDef: [string, string, SportType, number, boolean, string][] = [
  ['v1', 'Lapangan A · Senayan', 'Futsal', 220000, true, 'Rumput sintetis FIFA'],
  ['v1', 'Lapangan B · Senayan', 'Futsal', 200000, true, 'Rumput sintetis FIFA'],
  ['v1', 'Lapangan C · Rooftop', 'Futsal', 250000, false, 'Rumput sintetis Pro'],
  ['v2', 'Court 1 Manggarai', 'Bulu Tangkis', 90000, true, 'Karbon Internasional'],
  ['v2', 'Court 2 Manggarai', 'Bulu Tangkis', 85000, true, 'Karbon Internasional'],
  ['v2', 'Court 3 Manggarai', 'Bulu Tangkis', 75000, true, 'Vinyl Premium'],
  ['v2', 'Pojok Tenis Meja', 'Tenis Meja', 45000, true, 'ITTF Table'],
  ['v3', 'Main Court Gading', 'Basket', 320000, true, 'Maple NBA Standard'],
  ['v3', 'Practice Court', 'Basket', 260000, true, 'Vinyl Sport'],
  ['v4', 'Tenis Court 1', 'Tenis', 180000, false, 'Hardcourt Acrylic'],
  ['v4', 'Tenis Court 2', 'Tenis', 165000, false, 'Hardcourt Acrylic'],
  ['v4', 'Voli Indoor 1', 'Voli', 150000, true, 'Bantalan Empuk'],
  ['v4', 'Voli Indoor 2', 'Voli', 140000, true, 'Bantalan Empuk'],
  ['v5', 'Kolam Utama 8 Lintasan', 'Renang', 75000, true, 'Standar Kompetisi'],
];

const courts: Court[] = courtDef.map(([venueId, name, sport, price, indoor, surface], i) => ({
  id: `c${i + 1}`,
  venueId,
  name,
  sport,
  pricePerHour: price,
  image: SPORT_IMAGE[sport],
  facilities: venues
    .find((v) => v.id === venueId)!
    .facilities.slice(0, randInt(4, Math.min(8, venues.find((v) => v.id === venueId)!.facilities.length))),
  indoor,
  surface,
  active: true,
}));

const customers: Customer[] = [
  { id: 'cu1', name: 'Budi Santoso', email: 'budi.santoso@mail.com', phone: '+6281212345671', joinedAt: '2024-03-11', tier: 'silver', membershipUntil: addDays(todayISO(), 24), city: 'Jakarta Selatan' },
  { id: 'cu2', name: 'Rani Kusuma', email: 'rani.kusuma@mail.com', phone: '+6281212345672', joinedAt: '2024-06-02', tier: 'gold', membershipUntil: addDays(todayISO(), 61), city: 'Jakarta Timur' },
  { id: 'cu3', name: 'Fajar Nugroho', email: 'fajar.n@mail.com', phone: '+6281212345673', joinedAt: '2024-08-19', tier: 'non-member', city: 'Jakarta Utara' },
  { id: 'cu4', name: 'Michelle Tan', email: 'michelle.tan@mail.com', phone: '+6281212345674', joinedAt: '2025-01-07', tier: 'bronze', membershipUntil: addDays(todayISO(), 12), city: 'Tangerang Selatan' },
  { id: 'cu5', name: 'Hendra Wijaya', email: 'hendra.w@mail.com', phone: '+6281212345675', joinedAt: '2025-02-23', tier: 'non-member', city: 'Jakarta Selatan' },
  { id: 'cu6', name: 'Komunitas Sabtu Malam', email: 'sabtumalam@community.id', phone: '+6281212345676', joinedAt: '2024-04-14', tier: 'gold', membershipUntil: addDays(todayISO(), 90), city: 'Jakarta Selatan' },
  { id: 'cu7', name: 'Putri Ayla', email: 'putri.ayla@mail.com', phone: '+6281212345677', joinedAt: '2025-05-30', tier: 'non-member', city: 'Jakarta Timur' },
  { id: 'cu8', name: 'Yoga Pratama', email: 'yoga.p@mail.com', phone: '+6281212345678', joinedAt: '2025-09-12', tier: 'silver', membershipUntil: addDays(todayISO(), 35), city: 'Tangerang Selatan' },
];

const staff: Staff[] = [
  { id: 'st1', name: 'Rizky Pratama', role: 'owner', email: 'rizky@lapaklapangan.id', phone: '+628111100001', venueIds: ['v1', 'v2', 'v3', 'v4', 'v5'], active: true, joinedAt: '2023-01-10' },
  { id: 'st2', name: 'Dewi Lestari', role: 'admin', email: 'dewi@lapaklapangan.id', phone: '+628111100002', venueIds: ['v1', 'v2'], active: true, joinedAt: '2023-06-18' },
  { id: 'st3', name: 'Andi Saputra', role: 'kasir', email: 'andi@lapaklapangan.id', phone: '+628111100003', venueIds: ['v1'], active: true, joinedAt: '2024-02-05' },
  { id: 'st4', name: 'Sinta Maharani', role: 'kasir', email: 'sinta@lapaklapangan.id', phone: '+628111100004', venueIds: ['v3', 'v4', 'v5'], active: true, joinedAt: '2024-07-22' },
  { id: 'st5', name: 'Bagus Wicaksono', role: 'staff', email: 'bagus@lapaklapangan.id', phone: '+628111100005', venueIds: ['v2'], active: true, joinedAt: '2025-03-01' },
];

const vouchers: Voucher[] = [
  { code: 'WEEKEND10', type: 'percent', value: 10, minSpend: 100000, description: 'Diskon 10% booking akhir pekan', active: true, quota: 500, used: 218, expiresAt: addDays(todayISO(), 45) },
  { code: 'GOLDFRIDAY', type: 'nominal', value: 50000, minSpend: 250000, description: 'Potongan Rp50.000 tiap Jumat Malam', active: true, quota: 200, used: 96, expiresAt: addDays(todayISO(), 20) },
  { code: 'NEWPLAYER', type: 'nominal', value: 25000, minSpend: 75000, description: 'Voucher pengguna baru', active: true, quota: 1000, used: 640, expiresAt: addDays(todayISO(), 120) },
  { code: 'MEMBER15', type: 'percent', value: 15, minSpend: 200000, description: 'Khusus member Silver & Gold', active: true, quota: 300, used: 87, expiresAt: addDays(todayISO(), 60) },
  { code: 'RAMADHAN20', type: 'percent', value: 20, minSpend: 300000, description: 'Promo bulan Ramadhan (habis)', active: false, quota: 150, used: 150, expiresAt: addDays(todayISO(), -10) },
];

const reviewSeeds: [string, string, number, string][] = [
  ['cu2', 'Lapangan mulus, lampu terang banget. Kasir ramah 👍', 5, 'v1'],
  ['cu6', 'Langganan tiap Senin malam di sini. Rumputnya selalu bersih.', 5, 'v1'],
  ['cu3', 'Parkir agak sempit pas weekend, tapi lapangannya oke.', 4, 'v1'],
  ['cu5', 'Lapangan C rooftop panas pas siang, lebih enak malam.', 4, 'v1'],
  ['cu4', 'Shuttlecock-nya berkualitas, lantai licin dikit di court 3.', 4, 'v2'],
  ['cu7', 'Coach-nya sabar banget, anak saya jadi berani main.', 5, 'v2'],
  ['cu2', 'GOR legendaris, harga bersahabat, AC cukup.', 5, 'v2'],
  ['cu3', 'Ring stabil, tapi antrian weekend panjang. Wajib booking!', 4, 'v3'],
  ['cu8', 'Lantai maple enak buat dribble, scoreboard keren.', 5, 'v3'],
  ['cu4', 'Hardcourt-nya rapi, malam tidak silau lampu.', 5, 'v4'],
  ['cu8', 'Voli indoor-nya empuk, cocok buat latihan rutin.', 4, 'v4'],
  ['cu5', 'Air kolam bersih, coach-nya profesional.', 5, 'v5'],
  ['cu7', 'Lintasan luas, kamar ganti bersih.', 5, 'v5'],
];

const reviews: Review[] = reviewSeeds.map(([cu, comment, stars, v], i) => ({
  id: `rv${i + 1}`,
  venueId: v,
  courtId: pick(courts.filter((c) => c.venueId === v)).id,
  customerName: customers.find((c) => c.id === cu)!.name,
  stars,
  comment,
  at: addDays(todayISO(), -randInt(5, 120)),
}));

const broadcasts: Broadcast[] = [
  {
    id: 'bc1',
    title: 'Promo Jumat Berkah −20%',
    message: 'Booking lapangan apa pun setiap Jumat 14:00–18:00 dan dapatkan diskon 20%. Pakai kode RAMADHAN20 sebelum kuota habis!',
    audience: 'all',
    channels: ['whatsapp', 'push'],
    sentAt: addDays(todayISO(), -18),
    recipients: 1284,
    opened: 611,
  },
  {
    id: 'bc2',
    title: ' Jadwal Maintenance Lapangan C',
    message: 'Lapangan C Arena Senayan akan maintenance 2 hari. Booking dipindahkan otomatis & mendapat voucher 15%.',
    audience: 'venue-customers',
    venueId: 'v1',
    channels: ['whatsapp', 'email'],
    sentAt: addDays(todayISO(), -6),
    recipients: 96,
    opened: 74,
  },
];

const occupied = new Set<string>();
const key = (courtId: string, date: string, hour: number) => `${courtId}|${date}|${hour}`;

const methods = ['VA BCA', 'GoPay', 'OVO', 'QRIS', 'Kartu Kredit', 'Transfer Manual'];

const mkBooking = (
  customerId: string,
  court: Court,
  date: string,
  startHour: number,
  durationHours: number,
  status: Booking['status'],
  paymentStatus: Booking['paymentStatus'],
  createdAt: string,
  opts: Partial<Booking> = {},
): Booking => {
  const subtotal = court.pricePerHour * durationHours;
  const extras = opts.extras ?? [];
  const extrasTotal = extras.reduce((s, e) => s + e.price * e.qty, 0);
  const discount = opts.discount ?? 0;
  const total = subtotal + extrasTotal - discount;
  const paymentMode = opts.paymentMode ?? (rnd() > 0.45 ? 'dp' : 'full');
  const paidAmount =
    paymentStatus === 'paid'
      ? total
      : paymentStatus === 'dp_paid'
        ? Math.round(total * 0.3)
        : 0;
  return {
    id: `bk_${Math.random().toString(36).slice(2, 10)}`,
    code: bookingCode(),
    venueId: court.venueId,
    courtId: court.id,
    customerId,
    date,
    startHour,
    durationHours,
    status,
    paymentStatus,
    paymentMode,
    paymentMethod: paymentStatus === 'unpaid' ? undefined : pick(methods),
    subtotal,
    extrasTotal,
    discount,
    total,
    paidAmount,
    voucherCode: opts.voucherCode,
    splitWith: opts.splitWith ?? [],
    extras,
    recurring: opts.recurring ?? false,
    recurringGroupId: opts.recurringGroupId,
    notes: opts.notes,
    createdAt,
    remindersSent: opts.remindersSent ?? [],
    logs: [
      { at: createdAt, action: 'Booking dibuat oleh pelanggan', by: customers.find((c) => c.id === customerId)?.name ?? 'Pelanggan' },
      ...(status === 'confirmed' ? [{ at: createdAt, action: 'Booking disetujui admin', by: 'Dewi Lestari' }] : []),
      ...(paymentStatus !== 'unpaid' ? [{ at: createdAt, action: `Pembayaran diterima (${paymentMode === 'dp' ? 'DP 30%' : 'Full payment'})`, by: 'Midtrans' }] : []),
    ],
  };
};

const occupy = (b: Booking) => {
  for (let i = 0; i < b.durationHours; i++) occupied.add(key(b.courtId, b.date, b.startHour + i));
};

const bookings: Booking[] = [];

/* ---------- riwayat 90 hari (untuk laporan pendapatan) ---------- */
for (let d = 92; d >= 1; d--) {
  const date = addDays(todayISO(), -d);
  const count = randInt(2, 5);
  for (let i = 0; i < count; i++) {
    const court = pick(courts);
    const venue = venues.find((v) => v.id === court.venueId)!;
    const startHour = randInt(venue.openHour, venue.closeHour - 2);
    if (occupied.has(key(court.id, date, startHour))) continue;
    const dur = rnd() > 0.7 ? 2 : 1;
    const cu = pick(customers).id;
    const withExtras = rnd() > 0.65;
    const b = mkBooking(cu, court, date, startHour, dur, 'completed', rnd() > 0.08 ? 'paid' : 'dp_paid', `${date}T${String(randInt(8, 21)).padStart(2, '0')}:${String(randInt(10, 59))}:00`, {
      extras: withExtras ? [EXTRAS[randInt(0, 5)]].map((e) => ({ name: e.name, qty: randInt(1, 3), price: e.price })) : [],
      discount: rnd() > 0.75 ? 20000 : 0,
    });
    occupy(b);
    bookings.push(b);
  }
}

/* ---------- 14 hari ke depan (ketersediaan slot) ---------- */
for (let d = 0; d <= 14; d++) {
  const date = addDays(todayISO(), d);
  const count = randInt(3, 7);
  for (let i = 0; i < count; i++) {
    const court = pick(courts);
    const venue = venues.find((v) => v.id === court.venueId)!;
    const startHour = randInt(Math.max(venue.openHour, 8), venue.closeHour - 2);
    if (occupied.has(key(court.id, date, startHour))) continue;
    const dur = rnd() > 0.65 ? 2 : 1;
    const cu = pick(customers).id;
    const pending = rnd() > 0.72;
    const b = mkBooking(
      cu,
      court,
      date,
      startHour,
      dur,
      pending ? 'pending' : 'confirmed',
      pending ? (rnd() > 0.5 ? 'awaiting_verification' : 'unpaid') : rnd() > 0.4 ? 'dp_paid' : 'paid',
      new Date(Date.now() - randInt(1, 200) * 3_600_000).toISOString(),
      { extras: rnd() > 0.7 ? [{ ...EXTRAS[randInt(0, 5)], qty: 1 }] : [] },
    );
    occupy(b);
    bookings.push(b);
  }
}

/* ---------- booking milik pengguna demo (cu1) ---------- */
const c1 = 'cu1';
const futsalA = courts[0];
const bdA = courts[3];
const pool = courts[13];

const own: Booking[] = [];

const split3 = (total: number) => {
  const per = Math.round(total / 3);
  return [
    { name: 'Budi Santoso', amount: total - per * 2, paid: true, paidAt: new Date(Date.now() - 26 * 3600_000).toISOString(), method: 'GoPay' },
    { name: 'Agus (Striker)', amount: per, paid: true, paidAt: new Date(Date.now() - 20 * 3600_000).toISOString(), method: 'QRIS' },
    { name: 'Dimas (Kiper)', amount: per, paid: false },
  ];
};

let t = addDays(todayISO(), 3);
const b1 = mkBooking(c1, futsalA, t, 20, 2, 'confirmed', 'dp_paid', new Date(Date.now() - 30 * 3600_000).toISOString(), {
  paymentMode: 'dp',
  splitWith: split3(Math.round(futsalA.pricePerHour * 2 * 0.3)),
  notes: 'Minta air minum 1 dus ya bang 🙏',
  extras: [{ name: 'Sewa Bola Match', qty: 1, price: 25000 }],
});
own.push(b1);

t = addDays(todayISO(), 1);
const b2 = mkBooking(c1, bdA, t, 19, 1, 'confirmed', 'paid', new Date(Date.now() - 96 * 3600_000).toISOString(), {
  paymentMode: 'full',
  remindersSent: [addDays(todayISO(), 0)],
});
own.push(b2);

t = addDays(todayISO(), 5);
own.push(mkBooking(c1, pool, t, 8, 1, 'pending', 'unpaid', new Date(Date.now() - 5 * 3600_000).toISOString(), { notes: 'Butuh coach privat' }));

t = addDays(todayISO(), -12);
const b4 = mkBooking(c1, futsalA, t, 20, 2, 'completed', 'paid', new Date(Date.now() - 20 * 24 * 3600_000).toISOString(), {
  paymentMode: 'full',
  discount: 20000,
  voucherCode: 'NEWPLAYER',
  review: { stars: 5, comment: 'Lapangan selalu prima, langganan terus!', at: addDays(todayISO(), -11) },
});
own.push(b4);

t = addDays(todayISO(), -4);
own.push(mkBooking(c1, bdA, t, 21, 1, 'completed', 'paid', new Date(Date.now() - 7 * 24 * 3600_000).toISOString(), { paymentMode: 'full' }));

/* booking berulang: setiap Senin 20:00 */
let mondays = 0;
t = todayISO();
while (mondays < 5) {
  const dt = new Date(t);
  dt.setDate(dt.getDate() + 1);
  t = toISO(dt);
  if (new Date(t).getDay() === 1) {
    mondays++;
    own.push(
      mkBooking(c1, courts[1], t, 20, 1, 'confirmed', 'dp_paid', new Date(Date.now() - 12 * 24 * 3600_000).toISOString(), {
        recurring: true,
        recurringGroupId: 'rec_monday_demo',
        notes: 'Booking rutin komunitas Senin malam',
        paymentMode: 'dp',
      }),
    );
  }
}

/* pastikan slot milik demo user tidak dipakai data acak */
for (const b of own) {
  for (let i = 0; i < b.durationHours; i++) {
    occupied.add(key(b.courtId, b.date, b.startHour + i));
  }
  /* buang booking acak yang bentrok */
}
const clean = bookings.filter(
  (b) => !own.some((o) => o.courtId === b.courtId && o.date === b.date && Math.abs(o.startHour - b.startHour) < 2),
);
bookings.length = 0;
bookings.push(...clean, ...own);

const notifications: NotificationLog[] = [
  {
    id: 'nt1',
    channel: 'whatsapp',
    to: '+6281212345671',
    subject: 'Konfirmasi Booking LP-4K9P21',
    body: 'Halo Budi! Booking Lapangan A · Senayan pada Senin 20:00 sudah KONFIRMASI. Total Rp445.000, DP Rp133.500 diterima.',
    at: new Date(Date.now() - 30 * 3600_000).toISOString(),
    kind: 'booking',
    status: 'read',
  },
  {
    id: 'nt2',
    channel: 'whatsapp',
    to: '+6281212345671',
    subject: 'Reminder H-1 Jadwal Main',
    body: 'Jangan lupa! Besok kamu main bulu tangkis di GOR Manggarai Raya, 19:00. Tunjukkan kode booking di kasir.',
    at: new Date(Date.now() - 20 * 3600_000).toISOString(),
    kind: 'reminder',
    status: 'read',
  },
  {
    id: 'nt3',
    channel: 'email',
    to: 'rizky@lapaklapangan.id',
    subject: 'Laporan harian venue',
    body: 'Pendapatan hari ini Rp8.450.000 dari 14 booking. 2 booking menunggu konfirmasi pembayaran.',
    at: new Date(Date.now() - 6 * 3600_000).toISOString(),
    kind: 'system',
    status: 'delivered',
  },
  {
    id: 'nt4',
    channel: 'whatsapp',
    to: '+6281212345674',
    subject: 'Broadcast Promo Jumat',
    body: 'Promo Jumat Berkah −20% untuk semua lapangan. Segera booking slot favoritmu!',
    at: new Date(Date.now() - 72 * 3600_000).toISOString(),
    kind: 'broadcast',
    status: 'delivered',
  },
];

export const buildInitialState = (): AppState => ({
  venues,
  courts,
  bookings,
  customers,
  vouchers,
  staff,
  blocks: [
    { id: 'bl1', courtId: 'c3', date: addDays(todayISO(), 2), startHour: 10, durationHours: 3, reason: 'Maintenance rumput & lampu' },
    { id: 'bl2', courtId: 'c7', date: addDays(todayISO(), 1), startHour: 13, durationHours: 2, reason: 'Turnamen internal kantor' },
    { id: 'bl3', courtId: 'c14', date: addDays(todayISO(), 4), startHour: 7, durationHours: 2, reason: 'Kelas renang anak' },
  ],
  notifications,
  broadcasts,
  reviews,
  liveHolds: [],
  user: { role: 'customer', name: 'Budi Santoso', customerId: 'cu1', venueIds: venues.map((v) => v.id) },
});
