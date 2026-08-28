import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { TARGET_SEGMENT_LABELS, type Announcement, type OwnerVenue } from '../lib/types';
import { Badge, Button, Card, Field, Input } from '../components/ui';

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<{ data: Announcement[] }>('/manage/announcements')
      .then((res) => setAnnouncements(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (a: Announcement) => {
    await api.put(`/manage/announcements/${a.id}`, { is_active: !a.is_active });
    load();
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`Hapus pengumuman "${a.title}"?`)) return;
    await api.delete(`/manage/announcements/${a.id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo & Pengumuman</h1>
          <p className="mt-1 text-sm text-slate-500">Tampil di web (beranda &amp; akun pelanggan) — bukan didorong lewat WA/Email.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> {showForm ? 'Tutup Form' : 'Buat Pengumuman'}
        </Button>
      </div>

      {showForm && (
        <AnnouncementForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-400">Memuat…</p>}
        {!loading && announcements.length === 0 && <p className="text-sm text-slate-400">Belum ada pengumuman.</p>}
        {announcements.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <Badge tone={a.is_active ? 'success' : 'danger'}>{a.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Target: {TARGET_SEGMENT_LABELS[a.target_segment]}
                  {a.target_segment === 'venue' && a.venue ? ` (${a.venue.name})` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => toggleActive(a)} className="text-xs font-semibold text-[#1d5fc4] hover:underline">
                  {a.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => remove(a)} className="text-xs font-semibold text-rose-600 hover:underline">
                  Hapus
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnnouncementForm({ onCreated }: { onCreated: () => void }) {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetSegment, setTargetSegment] = useState<Announcement['target_segment']>('all');
  const [venueId, setVenueId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ data: OwnerVenue[] }>('/manage/venues').then((res) => setVenues(res.data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/manage/announcements', {
        title,
        body,
        target_segment: targetSegment,
        venue_id: targetSegment === 'venue' ? venueId : null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat pengumuman.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Judul" className="sm:col-span-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Kemerdekaan!" required />
        </Field>
        <Field label="Isi" className="sm:col-span-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Diskon spesial buat pelanggan setia..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
            required
          />
        </Field>
        <Field label="Target pelanggan">
          <select
            value={targetSegment}
            onChange={(e) => setTargetSegment(e.target.value as Announcement['target_segment'])}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            <option value="all">Semua pelanggan</option>
            <option value="venue">Pernah booking venue tertentu</option>
            <option value="member">Member saja</option>
          </select>
        </Field>
        {targetSegment === 'venue' && (
          <Field label="Venue">
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
              required
            >
              <option value="">Pilih venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Pengumuman'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
