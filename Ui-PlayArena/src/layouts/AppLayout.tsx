import { LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { ROLE_LABELS } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/ui';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d5fc4] font-bold text-sm text-white">
              P
            </div>
            <span className="font-bold text-slate-900">PlayArena</span>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                {(user.role === 'owner' || user.role === 'staff') && (
                  <>
                    <Link to="/manage/venues" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Kelola Lapangan
                    </Link>
                    <Link to="/manage/bookings" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Booking Masuk
                    </Link>
                    <Link to="/manage/analytics" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Analitik
                    </Link>
                  </>
                )}
                {user.role === 'owner' && (
                  <>
                    <Link to="/staff" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Kelola Staff
                    </Link>
                    <Link to="/manage/promos" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Voucher
                    </Link>
                    <Link to="/manage/customers" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Pelanggan
                    </Link>
                    <Link to="/manage/announcements" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Pengumuman
                    </Link>
                    <Link to="/manage/revenue" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Pendapatan
                    </Link>
                  </>
                )}
                {user.role === 'pelanggan' && (
                  <>
                    <Link to="/bookings" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Booking Saya
                    </Link>
                    <Link to="/announcements" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
                      Pengumuman
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold leading-tight text-slate-900">{user.name}</p>
                    <p className="text-xs leading-tight text-slate-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Keluar"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#1d5fc4]">
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
