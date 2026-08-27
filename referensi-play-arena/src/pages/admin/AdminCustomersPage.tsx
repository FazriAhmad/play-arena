import { useMemo, useState } from 'react';
import { Crown, Mail, Phone, Search } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Customer } from '../../lib/types';
import { addDays, fmtDateShort, rupiah, todayISO } from '../../lib/utils';
import { Badge, Card, Input, Modal, Select, SectionHeading, useToast } from '../../components/ui';

const TIER_TONE: Record<Customer['tier'], 'neutral' | 'warn' | 'info' | 'neon'> = {
  'non-member': 'neutral',
  bronze: 'warn',
  silver: 'info',
  gold: 'neon',
};

export const AdminCustomersPage = () => {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [detail, setDetail] = useState<Customer | null>(null);

  const stats = useMemo(() => {
    return state.customers.map((c) => {
      const bookings = state.bookings.filter((b) => b.customerId === c.id);
      const spend = bookings.reduce((s, b) => s + b.paidAmount, 0);
      return { customer: c, bookingCount: bookings.length, spend };
    });
  }, [state.customers, state.bookings]);

  const filtered = stats
    .filter(({ customer }) => tierFilter === 'all' || customer.tier === tierFilter)
    .filter(({ customer }) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return customer.name.toLowerCase().includes(q) || customer.email.toLowerCase().includes(q);
    })
    .sort((a, b) => b.spend - a.spend);

  const setTier = (id: string, tier: Customer['tier']) => {
    dispatch({
      type: 'PATCH_CUSTOMER',
      id,
      patch: { tier, membershipUntil: tier === 'non-member' ? undefined : addDays(todayISO(), 30) },
    });
    push('Tier member diperbarui');
  };

  return (
    <div>
      <SectionHeading
        eyebrow="CRM"
        title="Pelanggan & Member"
        description="Kelola data pelanggan, tingkat keanggotaan, dan riwayat transaksi."
        right={
          <div className="flex gap-2">
            <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="!w-auto">
              <option value="all">Semua Tier</option>
              <option value="non-member">Non-Member</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </Select>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama/email..." className="w-56 pl-8" />
            </div>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(['gold', 'silver', 'bronze', 'non-member'] as const).map((t) => (
          <Card key={t} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {state.customers.filter((c) => c.tier === t).length}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kontak</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Total Booking</th>
                <th className="px-4 py-3">Total Belanja</th>
                <th className="px-4 py-3">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filtered.map(({ customer, bookingCount, spend }) => (
                <tr key={customer.id} className="cursor-pointer hover:bg-white/[0.02]" onClick={() => setDetail(customer)}>
                  <td className="px-4 py-3 font-medium text-white">{customer.name}</td>
                  <td className="px-4 py-3 text-white/50">
                    <p>{customer.email}</p>
                    <p className="text-xs text-white/35">{customer.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={TIER_TONE[customer.tier]}>
                      {customer.tier === 'gold' && <Crown size={11} />} {customer.tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-white/60">{bookingCount}x</td>
                  <td className="px-4 py-3 font-semibold text-white">{rupiah(spend)}</td>
                  <td className="px-4 py-3 text-white/45">{fmtDateShort(customer.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} subtitle="Detail pelanggan">
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Mail size={14} /> {detail.email}
              </span>
              <span className="flex items-center gap-1.5 text-white/60">
                <Phone size={14} /> {detail.phone}
              </span>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Ubah Tier Membership</p>
              <div className="flex flex-wrap gap-2">
                {(['non-member', 'bronze', 'silver', 'gold'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(detail.id, t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      detail.tier === t ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/55'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Riwayat Booking</p>
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {state.bookings
                  .filter((b) => b.customerId === detail.id)
                  .slice(0, 10)
                  .map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                      <span className="text-white/60">
                        {b.code} · {fmtDateShort(b.date)}
                      </span>
                      <span className="font-semibold text-white">{rupiah(b.total)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
