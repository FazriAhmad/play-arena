import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { rupiah, type MembershipPlan } from '../lib/types';
import { Button, Card, Field, Input } from '../components/ui';

/** Modul 21 — satu plan membership bulanan per bisnis (satu owner multi-venue, bukan per venue). */
export default function ManageMembershipPage() {
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<{ data: MembershipPlan | null }>('/manage/membership-plan')
      .then((res) => {
        setPlan(res.data);
        if (res.data) {
          setPrice(String(res.data.price));
          setDiscountPercent(String(res.data.discount_percent));
          setIsActive(res.data.is_active);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.post<{ data: MembershipPlan }>('/manage/membership-plan', {
        price: Number(price),
        discount_percent: Number(discountPercent),
        is_active: isActive,
      });
      setPlan(res.data);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Memuat…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Membership Bulanan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pelanggan yang jadi member otomatis dapat diskon di setiap booking, tanpa perlu kode voucher.
      </p>

      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Harga per Bulan (Rp)">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50000" required />
          </Field>
          <Field label="Diskon per Booking (%)">
            <Input
              type="number"
              min={1}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="10"
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Plan aktif — diskon berlaku untuk pelanggan yang sedang jadi member
          </label>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan Plan'}
            </Button>
            {saved && <span className="text-xs font-medium text-emerald-600">Tersimpan.</span>}
          </div>
        </form>
      </Card>

      {plan && (
        <p className="mt-3 text-xs text-slate-400">
          Plan saat ini: {rupiah(plan.price)}/bulan, diskon {plan.discount_percent}% — {plan.is_active ? 'aktif' : 'nonaktif'}.
        </p>
      )}

      <Card className="mt-6 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Cara kerja</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
          <li>Pendaftaran &amp; pembayaran member tetap manual — tandai pelanggan sebagai member di halaman{' '}
            <span className="font-medium">Kelola Pelanggan</span> setelah menerima pembayaran, sama seperti konfirmasi pembayaran booking.
          </li>
          <li>Status member berlaku 1 bulan sejak ditandai, lalu otomatis dicabut kalau tidak diperpanjang.</li>
          <li>Diskon berlaku otomatis di semua venue milik Anda saat pelanggan booking, bisa digabung dengan kode voucher.</li>
        </ul>
      </Card>
    </div>
  );
}
