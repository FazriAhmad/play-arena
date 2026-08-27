import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { Staff, Venue } from '../lib/types';
import { Badge, Button, Card, Field, Input } from '../components/ui';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [staffRes, venueRes] = await Promise.all([
      api.get<{ data: Staff[] }>('/staff'),
      api.get<{ data: Venue[] }>('/venues/mine'),
    ]);
    setStaff(staffRes.data);
    setVenues(venueRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (member: Staff) => {
    await api.put(`/staff/${member.id}`, { is_active: !member.is_active });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Staff hanya bisa mengakses venue yang ditugaskan padanya.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> {showForm ? 'Tutup Form' : 'Tambah Staff'}
        </Button>
      </div>

      {showForm && (
        <StaffForm
          venues={venues}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Memuat…
                </td>
              </tr>
            )}
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Belum ada staff. Tambahkan lewat tombol di atas.
                </td>
              </tr>
            )}
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{s.email}</div>
                  <div className="text-xs text-slate-400">{s.phone}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.venues.length ? s.venues.map((v) => v.name).join(', ') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={s.is_active ? 'success' : 'danger'}>{s.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleActive(s)}
                    className="text-xs font-semibold text-[#1d5fc4] hover:underline"
                  >
                    {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StaffForm({ venues, onCreated }: { venues: Venue[]; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [venueIds, setVenueIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleVenue = (id: number) =>
    setVenueIds((ids) => (ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (venueIds.length === 0) {
      setError('Pilih minimal satu venue untuk staff ini.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/staff', { ...form, venue_ids: venueIds });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah staff.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama">
          <Input value={form.name} onChange={set('name')} placeholder="Nama staff" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set('email')} placeholder="staff@email.com" />
        </Field>
        <Field label="Nomor HP">
          <Input value={form.phone} onChange={set('phone')} placeholder="0812xxxxxxx" />
        </Field>
        <Field label="Password" hint="Minimal 8 karakter">
          <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        </Field>
        <Field label="Konfirmasi password">
          <Input
            type="password"
            value={form.password_confirmation}
            onChange={set('password_confirmation')}
            placeholder="••••••••"
          />
        </Field>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Venue yang ditugaskan
          </span>
          {venues.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada venue. Buat venue dulu sebelum menambah staff.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {venues.map((v) => (
                <label
                  key={v.id}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    venueIds.includes(v.id)
                      ? 'border-[#1d5fc4] bg-[#1d5fc4]/10 text-[#1d5fc4]'
                      : 'border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={venueIds.includes(v.id)} onChange={() => toggleVenue(v.id)} />
                  {v.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 sm:col-span-2">{error}</p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Staff'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
