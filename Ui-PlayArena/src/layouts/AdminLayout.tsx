import {
  BarChart3,
  Building2,
  Crown,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  Ticket,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ROLE_LABELS, type Role } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { cn } from '../lib/utils';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] };

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'staff'] },
  { to: '/manage/venues', label: 'Kelola Lapangan', icon: Building2, roles: ['owner', 'staff'] },
  { to: '/manage/bookings', label: 'Booking Masuk', icon: ListChecks, roles: ['owner', 'staff'] },
  { to: '/manage/analytics', label: 'Analitik', icon: BarChart3, roles: ['owner', 'staff'] },
  { to: '/staff', label: 'Kelola Staff', icon: UserCog, roles: ['owner'] },
  { to: '/manage/promos', label: 'Voucher', icon: Ticket, roles: ['owner'] },
  { to: '/manage/customers', label: 'Pelanggan', icon: Users, roles: ['owner'] },
  { to: '/manage/announcements', label: 'Pengumuman', icon: Megaphone, roles: ['owner'] },
  { to: '/manage/revenue', label: 'Pendapatan', icon: Wallet, roles: ['owner'] },
  { to: '/manage/membership', label: 'Membership', icon: Crown, roles: ['owner'] },
];

/** Sidebar admin/staff — dipakai `AppLayout` sebagai pengganti top-bar begitu role owner/staff, supaya menu yang sudah banyak (Fase 2/3) tidak numpuk sebaris. */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const visibleNav = NAV.filter((n) => n.roles.includes(user.role));

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition',
      isActive ? 'bg-[#1d5fc4]/10 text-[#1d5fc4]' : 'text-slate-600 hover:bg-slate-100',
    );

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d5fc4] font-bold text-sm text-white">
          P
        </div>
        <div>
          <p className="font-bold leading-none text-slate-900">PlayArena</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Panel Admin</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleNav.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={linkClass}>
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={logout}
            title="Keluar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 border-r border-slate-200 bg-white">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={18} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 p-2 text-slate-600">
              <Menu size={18} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1d5fc4] text-xs font-bold text-white">P</div>
              <span className="font-bold text-slate-900">PlayArena</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
