import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ROLE_LABELS, type Booking } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { useVenue } from '../store/VenueContext';
import { Badge, Card } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Halo, {user.name.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-sm text-slate-500">
        Masuk sebagai <span className="font-medium text-slate-700">{ROLE_LABELS[user.role]}</span>.
      </p>

      {user.role === 'owner' || user.role === 'staff' ? <OwnerStaffOverview /> : <PelangganOverview />}
    </div>
  );
}

/** Modul 17 — switcher venue di dashboard Owner/Staff. Semua fetch di bawah otomatis scoped ke venue yang dipilih. */
function OwnerStaffOverview() {
  const { user } = useAuth();
  const { venues, currentVenueId, currentVenue, setCurrentVenueId, loading: venuesLoading } = useVenue();
  const [pending, setPending] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentVenueId) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<{ data: Booking[] }>(`/manage/bookings?venue_id=${currentVenueId}&status=menunggu_acc`)
      .then((res) => setPending(res.data))
      .finally(() => setLoading(false));
  }, [currentVenueId]);

  if (venuesLoading) return <p className="mt-6 text-sm text-slate-400">Memuat…</p>;

  if (venues.length === 0) {
    return (
      <Card className="mt-6 p-6">
        <p className="text-sm text-slate-600">
          Belum ada venue.{' '}
          <Link to="/manage/venues" className="font-semibold text-[#1d5fc4] hover:underline">
            Tambahkan venue pertama Anda
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-6">
      {venues.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {venues.map((v) => (
            <button
              key={v.id}
              onClick={() => setCurrentVenueId(v.id)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                v.id === currentVenueId
                  ? 'border-[#1d5fc4] bg-[#1d5fc4]/10 text-[#1d5fc4]'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {currentVenue && (
        <Card className="mt-4 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">{currentVenue.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{currentVenue.city || 'Kota belum diisi'}</p>
            </div>
            <Badge tone={currentVenue.is_active ? 'success' : 'danger'}>
              {currentVenue.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[#1d5fc4]/10 p-3">
              <p className="text-xs text-[#164a9c]">Lapangan</p>
              <p className="mt-1 text-lg font-bold text-[#164a9c]">{currentVenue.courts_count}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-xs text-orange-700">Menunggu ACC</p>
              <p className="mt-1 text-lg font-bold text-orange-700">{loading ? '…' : pending.length}</p>
            </div>
          </div>

          {!loading && pending.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Perlu Tindakan</p>
              <div className="mt-2 space-y-2">
                {pending.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                    <span className="text-amber-800">
                      {b.court?.name} · {new Date(b.starts_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/manage/bookings" className="mt-3 inline-block text-xs font-semibold text-[#1d5fc4] hover:underline">
                Lihat &amp; proses semua →
              </Link>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs">
            <Link to={`/manage/venues/${currentVenue.id}`} className="font-semibold text-[#1d5fc4] hover:underline">
              Kelola Venue Ini
            </Link>
            <Link to="/manage/bookings" className="font-semibold text-[#1d5fc4] hover:underline">
              Booking Masuk
            </Link>
            <Link to="/manage/analytics" className="font-semibold text-[#1d5fc4] hover:underline">
              Lihat Analitik
            </Link>
            {user?.role === 'owner' && (
              <Link to="/manage/revenue" className="font-semibold text-[#1d5fc4] hover:underline">
                Laporan Pendapatan
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function PelangganOverview() {
  return (
    <Card className="mt-6 p-6">
      <p className="text-sm text-slate-600">
        Cari lapangan &amp; booking lewat <Link to="/" className="font-semibold text-[#1d5fc4] hover:underline">beranda</Link>, lalu
        pantau statusnya di{' '}
        <Link to="/bookings" className="font-semibold text-[#1d5fc4] hover:underline">
          Booking Saya
        </Link>
        .
      </p>
    </Card>
  );
}
