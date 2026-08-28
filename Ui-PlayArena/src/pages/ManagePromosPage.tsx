import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { rupiah, type OwnerVenue, type Promo } from '../lib/types';
import { Badge, Button, Card, Field, Input } from '../components/ui';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ManagePromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<{ data: Promo[] }>('/manage/promos')
      .then((res) => setPromos(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (promo: Promo) => {
    await api.put(`/manage/promos/${promo.id}`, { is_active: !promo.is_active });
    load();
  };

  const remove = async (promo: Promo) => {
    if (!confirm(`Hapus voucher ${promo.code}?`)) return;
    await api.delete(`/manage/promos/${promo.id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voucher & Kode Promo</h1>
          <p className="mt-1 text-sm text-slate-500">Diskon terkontrol untuk pelanggan, bukan potongan manual.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> {showForm ? 'Tutup Form' : 'Buat Voucher'}
        </Button>
      </div>

      {showForm && (
        <PromoForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-400">Memuat…</p>}
        {!loading && promos.length === 0 && <p className="text-sm text-slate-400">Belum ada voucher.</p>}
        {promos.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{p.code}</span>
                  <Badge tone={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {p.discount_type === 'percent' ? `${p.value}%` : rupiah(p.value)}
                  {p.min_amount ? ` · min. transaksi ${rupiah(p.min_amount)}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {p.venue?.name ?? 'Semua venue'} · {p.quota ? `${p.used_count}/${p.quota} dipakai` : `${p.used_count}x dipakai, tanpa batas`}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(p.starts_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })} –{' '}
                  {new Date(p.ends_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => toggleActive(p)} className="text-xs font-semibold text-[#1d5fc4] hover:underline">
                  {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => remove(p)} className="text-xs font-semibold text-rose-600 hover:underline">
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

function PromoForm({ onCreated }: { onCreated: () => void }) {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [venueId, setVenueId] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('10');
  const [minAmount, setMinAmount] = useState('');
  const [quota, setQuota] = useState('');
  const [startsAt, setStartsAt] = useState(todayISO());
  const [endsAt, setEndsAt] = useState(todayISO());
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
      await api.post('/manage/promos', {
        venue_id: venueId || null,
        code,
        discount_type: discountType,
        value: Number(value),
        min_amount: minAmount ? Number(minAmount) : null,
        quota: quota ? Number(quota) : null,
        starts_at: startsAt,
        ends_at: endsAt,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat voucher.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kode voucher">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="AGUSTUS20" required />
        </Field>
        <Field label="Venue">
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            <option value="">Semua venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Jenis diskon">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            <option value="percent">Persen (%)</option>
            <option value="fixed">Nominal (Rp)</option>
          </select>
        </Field>
        <Field label={discountType === 'percent' ? 'Nilai diskon (%)' : 'Nilai diskon (Rp)'}>
          <Input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} required />
        </Field>
        <Field label="Minimal transaksi (Rp)" hint="Opsional">
          <Input type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Kuota pemakaian" hint="Kosongkan untuk tanpa batas">
          <Input type="number" min={1} value={quota} onChange={(e) => setQuota(e.target.value)} placeholder="Tanpa batas" />
        </Field>
        <Field label="Mulai berlaku">
          <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </Field>
        <Field label="Sampai">
          <Input type="date" value={endsAt} min={startsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Voucher'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
