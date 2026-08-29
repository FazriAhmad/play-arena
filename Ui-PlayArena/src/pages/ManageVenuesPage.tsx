import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import type { OwnerVenue } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import { Badge, Button, Card, Field, Input } from '../components/ui';

export default function ManageVenuesPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<{ data: OwnerVenue[] }>('/manage/venues')
      .then((res) => setVenues(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Lapangan</h1>
          <p className="mt-1 text-sm text-slate-400">
            {user?.role === 'owner' ? 'Venue dan lapangan yang tampil di direktori publik.' : 'Venue tempat Anda ditugaskan.'}
          </p>
        </div>
        {user?.role === 'owner' && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} /> {showForm ? 'Tutup Form' : 'Tambah Venue'}
          </Button>
        )}
      </div>

      {showForm && (
        <VenueForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-slate-500">Memuat…</p>}
        {!loading && venues.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada venue. Tambahkan lewat tombol di atas.</p>
        )}
        {venues.map((v) => (
          <Link key={v.id} to={`/manage/venues/${v.id}`}>
            <Card className="p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{v.name}</h3>
                  <p className="text-xs text-slate-400">{v.city || 'Kota belum diisi'}</p>
                </div>
                <Badge tone={v.is_active ? 'success' : 'danger'}>{v.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-400">{v.courts_count} lapangan</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function VenueForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', city: '', address: '', lat: '', lng: '', open_hour: '6', close_hour: '23' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/manage/venues', {
        name: form.name,
        city: form.city || null,
        address: form.address || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        open_hour: Number(form.open_hour),
        close_hour: Number(form.close_hour),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah venue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama venue">
          <Input value={form.name} onChange={set('name')} placeholder="mis. Arena Futsal Kemang" required />
        </Field>
        <Field label="Kota">
          <Input value={form.city} onChange={set('city')} placeholder="mis. Jakarta Selatan" />
        </Field>
        <Field label="Alamat" className="sm:col-span-2">
          <Input value={form.address} onChange={set('address')} placeholder="Jl. Kemang Raya No.1" />
        </Field>
        <Field label="Latitude" hint="Opsional, buat peta lokasi">
          <Input value={form.lat} onChange={set('lat')} placeholder="-6.26" />
        </Field>
        <Field label="Longitude" hint="Opsional, buat peta lokasi">
          <Input value={form.lng} onChange={set('lng')} placeholder="106.81" />
        </Field>
        <Field label="Jam buka">
          <Input type="number" min={0} max={23} value={form.open_hour} onChange={set('open_hour')} />
        </Field>
        <Field label="Jam tutup">
          <Input type="number" min={1} max={24} value={form.close_hour} onChange={set('close_hour')} />
        </Field>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Venue'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
