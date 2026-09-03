import { LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { ROLE_LABELS } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/ui';
import AdminLayout from './AdminLayout';

/** Owner/staff punya banyak menu (Fase 2/3) — dipindah ke sidebar `AdminLayout` sendiri, bukan top-bar ini. */
export default function AppLayout() {
  const { user, logout } = useAuth();

  if (user && ['owner', 'staff', 'petugas'].includes(user.role)) {
    return <AdminLayout />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1d5fc4] to-[#f97316] font-bold text-sm text-white">
              P
            </div>
            <span className="font-bold text-white">PlayArena</span>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/bookings" className="text-sm font-medium text-slate-300 hover:text-[#1d5fc4]">
                  Booking Saya
                </Link>
                <Link to="/announcements" className="text-sm font-medium text-slate-300 hover:text-[#1d5fc4]">
                  Pengumuman
                </Link>
                <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold leading-tight text-white">{user.name}</p>
                    <p className="text-xs leading-tight text-slate-400">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Keluar"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-[#1d5fc4]">
                  Masuk
                </Link>
                <Link to="/register">
                  <Button className="px-3.5 py-2 text-xs">Daftar</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
