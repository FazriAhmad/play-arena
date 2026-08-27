import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  ShoppingBag,
  Users,
  UserCog,
  Wallet,
  X,
  ArrowLeftRight,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { canAccess, ROLE_LABEL, type NavKey } from '../lib/permissions';
import type { StaffRole } from '../lib/types';
import { cn, initials } from '../lib/utils';

const NAV: { key: NavKey; to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'venues', to: '/admin/venue', label: 'Venue', icon: Building2 },
  { key: 'courts', to: '/admin/lapangan', label: 'Data Lapangan', icon: ShoppingBag },
  { key: 'schedule', to: '/admin/jadwal', label: 'Jam & Blokir Slot', icon: CalendarClock },
  { key: 'bookings', to: '/admin/booking', label: 'Kelola Booking', icon: ListChecks },
  { key: 'payments', to: '/admin/pembayaran', label: 'Konfirmasi Pembayaran', icon: Wallet },
  { key: 'reports', to: '/admin/laporan', label: 'Laporan Pendapatan', icon: BadgeDollarSign },
  { key: 'customers', to: '/admin/pelanggan', label: 'Pelanggan & Member', icon: Users },
  { key: 'broadcast', to: '/admin/broadcast', label: 'Broadcast Promo', icon: Megaphone },
  { key: 'staff', to: '/admin/staff', label: 'Staff & Kasir', icon: UserCog },
];

export const AdminLayout = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);

  const currentStaff = state.staff.find((s) => s.id === state.user.staffId) ?? state.staff[0];
  const role: StaffRole = currentStaff?.role ?? 'owner';
  const visibleNav = useMemo(() => NAV.filter((n) => canAccess(role, n.key)), [role]);

  const switchStaff = (id: string) => {
    const s = state.staff.find((x) => x.id === id);
    if (!s) return;
    dispatch({
      type: 'SET_USER',
      user: { role: s.role, name: s.name, staffId: s.id, venueIds: s.venueIds },
    });
    setRoleMenu(false);
    navigate('/admin');
  };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-400 to-violet-400 font-display text-lg font-black text-ink-950">
          L
        </span>
        <div>
          <p className="font-display text-sm font-bold leading-none text-white">LapakLapangan</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-aqua-300">
            Admin Panel
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleNav.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-aqua-400/20 to-transparent text-aqua-300 border border-aqua-400/25'
                  : 'text-white/55 hover:bg-white/5 hover:text-white border border-transparent',
              )
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3">
        <button
          onClick={() => navigate('/')}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-semibold text-white/60 transition hover:border-neon-400/40 hover:text-neon-300"
        >
          <ArrowLeftRight size={15} /> Lihat sebagai Pelanggan
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-bg relative min-h-screen text-white lg:flex">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/8 bg-ink-950/70 backdrop-blur-xl lg:block">
        {Sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 border-r border-white/10 bg-ink-950">{Sidebar}</div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 border-b border-white/8 bg-ink-950/70 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-lg border border-white/10 p-2 text-white/70 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="font-display text-lg font-bold text-white">
                  Halo, {currentStaff?.name.split(' ')[0]} 👋
                </p>
                <p className="text-xs text-white/40">
                  Mengelola{' '}
                  {role === 'owner'
                    ? 'seluruh venue'
                    : state.venues
                        .filter((v) => currentStaff?.venueIds.includes(v.id))
                        .map((v) => v.name)
                        .join(', ')}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setRoleMenu((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 py-1.5 pl-1.5 pr-3 transition hover:border-aqua-400/40"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-400 to-aqua-400 text-[11px] font-bold text-ink-950">
                  {initials(currentStaff?.name ?? 'Admin')}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-white">{currentStaff?.name}</span>
                  <span className="block text-[10px] text-aqua-300">{ROLE_LABEL[role]}</span>
                </span>
                <ChevronDown size={14} className="text-white/40" />
              </button>

              {roleMenu && (
                <div className="glass-strong absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl p-2">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Ganti akun staff (demo)
                  </p>
                  {state.staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => switchStaff(s.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/8',
                        s.id === currentStaff?.id && 'bg-white/8',
                      )}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                        {initials(s.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-white">{s.name}</span>
                        <span className="block text-[11px] text-white/40">{ROLE_LABEL[s.role]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AdminBrandLink = () => <Link to="/admin" />;
