import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { ADMIN_ROLES, type OwnerVenue } from '../lib/types';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'playarena_current_venue_id';

/**
 * Modul 17 — switcher venue Owner/Staff/Petugas. Daftar venue = /manage/venues,
 * sudah scoped benar per role di backend (owner: venue miliknya; staff &
 * petugas: venue yang ditugaskan lewat pivot `venue_staff`) — context ini cuma
 * menyimpan mana yang lagi "aktif" dilihat di dashboard, tidak menegakkan
 * otorisasi apa pun sendiri (itu tetap tanggung jawab tiap endpoint).
 *
 * `petugas` sempat KELUPAAN di daftar role ini waktu rolenya dibuat, efeknya
 * SEMUA halaman yang bergantung pada venue aktif (Jadwal, kartu venue di
 * Dashboard, switcher venue) kosong untuk mereka walaupun menunya tampil dan
 * endpointnya mengizinkan. Kalau nanti nambah role admin baru lagi, ingat
 * tempat ini — bukan cuma NAV `AdminLayout` dan `RoleRoute`.
 */
interface VenueState {
  venues: OwnerVenue[];
  currentVenueId: number | null;
  currentVenue: OwnerVenue | null;
  setCurrentVenueId: (id: number) => void;
  loading: boolean;
}

const VenueContext = createContext<VenueState | null>(null);

export function VenueProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [currentVenueId, setCurrentVenueIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      setVenues([]);
      setCurrentVenueIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<{ data: OwnerVenue[] }>('/manage/venues')
      .then((res) => {
        setVenues(res.data);
        const stored = Number(localStorage.getItem(STORAGE_KEY));
        const validStored = res.data.find((v) => v.id === stored);
        setCurrentVenueIdState((validStored ?? res.data[0])?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const setCurrentVenueId = (id: number) => {
    setCurrentVenueIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const currentVenue = venues.find((v) => v.id === currentVenueId) ?? null;

  return (
    <VenueContext.Provider value={{ venues, currentVenueId, currentVenue, setCurrentVenueId, loading }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenue harus dipakai di dalam VenueProvider');
  return ctx;
}
