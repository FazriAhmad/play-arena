import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarRange,
  LayoutGrid,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';

const navItems = [
  { to: '/', label: 'Beranda', icon: Sparkles, end: true },
  { to: '/cari', label: 'Cari Lapangan', icon: Search, end: false },
  { to: '/booking-saya', label: 'Booking Saya', icon: CalendarRange, end: false },
  { to: '/membership', label: 'Membership', icon: Wallet, end: false },
];

export const CustomerLayout = () => {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const me = state.customers.find((c) => c.id === state.user.customerId);

  return (
    <div className="app-bg relative min-h-screen text-white">
      <div className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <header className="no-print sticky top-0 z-40 border-b border-white/8 bg-ink-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon-400 to-aqua-400 font-display text-lg font-black text-ink-950">
              L
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Lapak<span className="text-neon-400">Lapangan</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-neon-400 text-ink-950' : 'text-white/60 hover:text-white'
                  }`
                }
              >
                <item.icon size={15} /> {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/70 transition hover:border-aqua-400/50 hover:text-aqua-300 sm:flex"
            >
              <ShieldCheck size={14} /> Masuk sebagai Admin
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-aqua-400 to-violet-400 text-[11px] font-bold text-ink-950">
                {me?.name.slice(0, 1) ?? 'U'}
              </span>
              <span className="text-xs font-semibold text-white/80">{me?.name ?? 'Tamu'}</span>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-white/70 lg:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="glass-strong absolute right-0 top-0 h-full w-72 p-5"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display font-bold">Menu</span>
                <button onClick={() => setOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold ${
                        isActive ? 'bg-neon-400 text-ink-950' : 'text-white/70'
                      }`
                    }
                  >
                    <item.icon size={16} /> {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate('/admin');
                  }}
                  className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-aqua-300"
                >
                  <ShieldCheck size={16} /> Masuk sebagai Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative">
        <Outlet />
      </main>

      <footer className="no-print relative mt-20 border-t border-white/8 bg-ink-950/60 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-400 to-aqua-400 font-display text-sm font-black text-ink-950">
                L
              </span>
              <span className="font-display text-base font-bold">LapakLapangan</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/45">
              Platform booking lapangan olahraga #1 — futsal, bulu tangkis, basket, tenis, voli, hingga kolam renang. Real-time, aman, transparan.
            </p>
          </div>
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/40">
              <LayoutGrid size={12} /> Produk
            </p>
            <ul className="space-y-2 text-sm text-white/55">
              <li>Cari Lapangan</li>
              <li>Booking Berulang</li>
              <li>Split Payment</li>
              <li>Membership</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/40">
              <User size={12} /> Untuk Bisnis
            </p>
            <ul className="space-y-2 text-sm text-white/55">
              <li>Daftarkan Venue</li>
              <li>Dashboard Admin</li>
              <li>Laporan Pendapatan</li>
              <li>Broadcast Promo</li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl px-6 text-xs text-white/30">
          © {new Date().getFullYear()} LapakLapangan. Dibuat untuk demo produk booking lapangan olahraga.
        </p>
      </footer>
    </div>
  );
};
