import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppUser,
  AppState,
  BlockSlot,
  Booking,
  Broadcast,
  Court,
  Customer,
  NotificationLog,
  Review,
  Staff,
  Venue,
  Voucher,
} from '../lib/types';
import { buildInitialState } from '../data/seed';
import { addDays, bookingCode, findConflict, hoursUntil, todayISO } from '../lib/utils';

const STORAGE_KEY = 'lapak-lapangan-state-v1';

export type Action =
  | { type: 'SET_USER'; user: AppUser }
  | { type: 'ADD_BOOKINGS'; bookings: Booking[] }
  | { type: 'PATCH_BOOKING'; id: string; patch: Partial<Booking>; log?: string }
  | { type: 'ADD_REVIEW'; review: Review }
  | { type: 'ADD_COURT'; court: Court }
  | { type: 'PATCH_COURT'; id: string; patch: Partial<Court> }
  | { type: 'REMOVE_COURT'; id: string }
  | { type: 'ADD_VENUE'; venue: Venue }
  | { type: 'PATCH_VENUE'; id: string; patch: Partial<Venue> }
  | { type: 'ADD_BLOCK'; block: BlockSlot }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'ADD_VOUCHER'; voucher: Voucher }
  | { type: 'PATCH_VOUCHER'; code: string; patch: Partial<Voucher> }
  | { type: 'ADD_STAFF'; staff: Staff }
  | { type: 'PATCH_STAFF'; id: string; patch: Partial<Staff> }
  | { type: 'REMOVE_STAFF'; id: string }
  | { type: 'ADD_CUSTOMER'; customer: Customer }
  | { type: 'PATCH_CUSTOMER'; id: string; patch: Partial<Customer> }
  | { type: 'ADD_NOTIFICATIONS'; items: NotificationLog[] }
  | { type: 'ADD_BROADCAST'; broadcast: Broadcast }
  | { type: 'LIVE_HOLD'; courtId: string; date: string; startHour: number }
  | { type: 'CLEAR_HOLDS' }
  | { type: 'RUN_REMINDERS' }
  | { type: 'RESET' };

const logEntry = (action: string, by = 'Sistem') => ({
  at: new Date().toISOString(),
  action,
  by,
});

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };

    case 'ADD_BOOKINGS': {
      const bookings = [...state.bookings, ...action.bookings];
      const notifs: NotificationLog[] = action.bookings.map((b) => ({
        id: `nt_${b.id}`,
        channel: 'whatsapp',
        to: state.customers.find((c) => c.id === b.customerId)?.phone ?? '',
        subject: `Booking ${b.code} diterima`,
        body: `Booking ${b.code} untuk ${state.courts.find((c) => c.id === b.courtId)?.name} pada ${b.date} pukul ${b.startHour}:00 sudah dibuat. Status: MENUNGGU KONFIRMASI.`,
        at: new Date().toISOString(),
        kind: 'booking',
        status: 'sent',
      }));
      const extra = action.bookings.some((b) => b.paymentStatus !== 'unpaid')
        ? [
            {
              id: `nt_pay_${action.bookings[0].id}`,
              channel: 'email' as const,
              to: state.customers.find((c) => c.id === action.bookings[0].customerId)?.email ?? '',
              subject: `Invoice ${action.bookings[0].code}`,
              body: `Invoice elektronik untuk booking ${action.bookings[0].code} sudah diterbitkan dan dikirim ke email Anda.`,
              at: new Date().toISOString(),
              kind: 'payment' as const,
              status: 'delivered' as const,
            },
          ]
        : [];
      return { ...state, bookings, notifications: [...notifs, ...extra, ...state.notifications] };
    }

    case 'PATCH_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id
            ? {
                ...b,
                ...action.patch,
                logs: action.log ? [...b.logs, logEntry(action.log, state.user.name)] : b.logs,
              }
            : b,
        ),
      };

    case 'ADD_REVIEW':
      return { ...state, reviews: [action.review, ...state.reviews] };

    case 'ADD_COURT':
      return { ...state, courts: [...state.courts, action.court] };

    case 'PATCH_COURT':
      return {
        ...state,
        courts: state.courts.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    case 'REMOVE_COURT':
      return { ...state, courts: state.courts.filter((c) => c.id !== action.id) };

    case 'ADD_VENUE':
      return { ...state, venues: [...state.venues, action.venue] };

    case 'PATCH_VENUE':
      return {
        ...state,
        venues: state.venues.map((v) => (v.id === action.id ? { ...v, ...action.patch } : v)),
      };

    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };

    case 'REMOVE_BLOCK':
      return { ...state, blocks: state.blocks.filter((b) => b.id !== action.id) };

    case 'ADD_VOUCHER':
      return { ...state, vouchers: [...state.vouchers, action.voucher] };

    case 'PATCH_VOUCHER':
      return {
        ...state,
        vouchers: state.vouchers.map((v) =>
          v.code === action.code ? { ...v, ...action.patch } : v,
        ),
      };

    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.staff] };

    case 'PATCH_STAFF':
      return {
        ...state,
        staff: state.staff.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      };

    case 'REMOVE_STAFF':
      return { ...state, staff: state.staff.filter((s) => s.id !== action.id) };

    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.customer] };

    case 'PATCH_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };

    case 'ADD_NOTIFICATIONS':
      return { ...state, notifications: [...action.items, ...state.notifications] };

    case 'ADD_BROADCAST':
      return {
        ...state,
        broadcasts: [action.broadcast, ...state.broadcasts],
        notifications: [
          ...action.broadcast.channels.map((ch, i) => ({
            id: `nt_bc_${action.broadcast.id}_${i}`,
            channel: ch,
            to:
              action.broadcast.audience === 'all'
                ? '1.284 pelanggan terdaftar'
                : `${action.broadcast.recipients} pelanggan`,
            subject: action.broadcast.title,
            body: action.broadcast.message,
            at: action.broadcast.sentAt,
            kind: 'broadcast' as const,
            status: 'sent' as const,
          })),
          ...state.notifications,
        ],
      };

    case 'LIVE_HOLD':
      return {
        ...state,
        liveHolds: [
          { courtId: action.courtId, date: action.date, startHour: action.startHour, at: new Date().toISOString() },
          ...state.liveHolds,
        ].slice(0, 6),
      };

    case 'CLEAR_HOLDS':
      return { ...state, liveHolds: [] };

    case 'RUN_REMINDERS': {
      const tomorrow = addDays(todayISO(), 1);
      const due = state.bookings.filter(
        (b) =>
          b.date === tomorrow &&
          (b.status === 'confirmed' || b.status === 'pending') &&
          !b.remindersSent.includes(tomorrow),
      );
      if (!due.length) return state;
      const notifs: NotificationLog[] = due.map((b, i) => ({
        id: `nt_rem_${b.id}_${i}`,
        channel: 'whatsapp',
        to: state.customers.find((c) => c.id === b.customerId)?.phone ?? '',
        subject: `Reminder H-1 · ${b.code}`,
        body: `Besok ${b.date} pukul ${b.startHour}:00 kamu main di ${
          state.venues.find((v) => v.id === b.venueId)?.name
        }. Simpan kode booking ${b.code}. Batalkan maksimal H-12 jam untuk dapat refund.`,
        at: new Date().toISOString(),
        kind: 'reminder',
        status: 'sent',
      }));
      return {
        ...state,
        notifications: [...notifs, ...state.notifications],
        bookings: state.bookings.map((b) =>
          due.includes(b) ? { ...b, remindersSent: [...b.remindersSent, tomorrow] } : b,
        ),
      };
    }

    case 'RESET':
      localStorage.removeItem(STORAGE_KEY);
      return buildInitialState();

    default:
      return state;
  }
};

const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.venues?.length && parsed?.courts?.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return buildInitialState();
};

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  venueRating: (venueId: string) => { avg: number; count: number };
  courtById: (id: string) => Court | undefined;
  venueById: (id: string) => Venue | undefined;
  customerById: (id: string) => Customer | undefined;
  conflict: (
    courtId: string,
    date: string,
    startHour: number,
    durationHours: number,
  ) => string | null;
  myBookings: (customerId: string) => Booking[];
}

const StoreContext = createContext<StoreValue | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage penuh — abaikan */
    }
  }, [state]);

  const venueRating = useCallback(
    (venueId: string) => {
      const list = state.reviews.filter((r) => r.venueId === venueId);
      if (!list.length) return { avg: 0, count: 0 };
      return {
        avg: Math.round((list.reduce((s, r) => s + r.stars, 0) / list.length) * 10) / 10,
        count: list.length,
      };
    },
    [state.reviews],
  );

  const helpers = useMemo<Omit<StoreValue, 'state' | 'dispatch' | 'venueRating'>>(
    () => ({
      courtById: (id) => state.courts.find((c) => c.id === id),
      venueById: (id) => state.venues.find((v) => v.id === id),
      customerById: (id) => state.customers.find((c) => c.id === id),
      conflict: (courtId, date, startHour, durationHours) =>
        findConflict(state.bookings, state.blocks, state.liveHolds, courtId, date, startHour, durationHours),
      myBookings: (customerId) =>
        state.bookings
          .filter((b) => b.customerId === customerId)
          .sort((a, b) => (a.date + a.startHour < b.date + b.startHour ? 1 : -1)),
    }),
    [state.bookings, state.blocks, state.liveHolds, state.courts, state.venues, state.customers],
  );

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, venueRating, ...helpers }),
    [state, helpers, venueRating],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider');
  return ctx;
};

/** Simulasi ketersediaan real-time: slot acak "diambil" pengguna lain tiap beberapa detik */
export const useLiveAvailability = (enabled: boolean) => {
  const { state, dispatch } = useStore();
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const court = state.courts[Math.floor(Math.random() * state.courts.length)];
      if (!court) return;
      const date = addDays(todayISO(), Math.floor(Math.random() * 5));
      const venue = state.venues.find((v) => v.id === court.venueId);
      if (!venue) return;
      const hour = 8 + Math.floor(Math.random() * 12);
      dispatch({ type: 'LIVE_HOLD', courtId: court.id, date, startHour: hour });
      setEvents((e) =>
        [
          `${court.name} · ${date === todayISO() ? 'hari ini' : date} ${String(hour).padStart(2, '0')}:00 baru saja dipesan`,
          ...e,
        ].slice(0, 3),
      );
    };
    const id = window.setInterval(tick, 14_000);
    const cleanup = window.setInterval(() => dispatch({ type: 'CLEAR_HOLDS' }), 60_000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(cleanup);
    };
  }, [enabled, state.courts, state.venues, dispatch]);

  return events;
};

export const useReminderRunner = () => {
  const { state, dispatch } = useStore();
  return useCallback(() => {
    const tomorrow = addDays(todayISO(), 1);
    const due = state.bookings.filter(
      (b) =>
        b.date === tomorrow &&
        (b.status === 'confirmed' || b.status === 'pending') &&
        !b.remindersSent.includes(tomorrow) &&
        hoursUntil(b.date, b.startHour) > 0,
    );
    dispatch({ type: 'RUN_REMINDERS' });
    return due.length;
  }, [state.bookings, dispatch]);
};

export const newBookingStub = (
  court: Court,
  customerId: string,
  date: string,
  startHour: number,
  durationHours: number,
  totals: { subtotal: number; extrasTotal: number; discount: number; total: number },
): Booking => ({
  id: `bk_${Math.random().toString(36).slice(2, 10)}`,
  code: bookingCode(),
  venueId: court.venueId,
  courtId: court.id,
  customerId,
  date,
  startHour,
  durationHours,
  status: 'pending',
  paymentStatus: 'unpaid',
  paymentMode: 'full',
  subtotal: totals.subtotal,
  extrasTotal: totals.extrasTotal,
  discount: totals.discount,
  total: totals.total,
  paidAmount: 0,
  splitWith: [],
  extras: [],
  recurring: false,
  createdAt: new Date().toISOString(),
  remindersSent: [],
  logs: [logEntry('Booking dibuat oleh pelanggan', 'Pelanggan')],
});
