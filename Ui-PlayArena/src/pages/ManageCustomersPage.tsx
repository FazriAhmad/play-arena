import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BOOKING_STATUS_LABELS, rupiah, type Booking, type BookingStatus, type Customer, type CustomerDetail } from '../lib/types';
import { Badge, Card } from '../components/ui';

const STATUS_TONE: Record<BookingStatus, 'neutral' | 'success' | 'danger'> = {
  menunggu_acc: 'neutral',
  menunggu_bayar: 'neutral',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  completed: 'success',
};

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<{ data: Customer[] }>('/manage/customers')
      .then((res) => setCustomers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setMember = async (customer: Customer, isMember: boolean) => {
    await api.put(`/manage/customers/${customer.id}`, { is_member: isMember });
    load();
  };

  const rejectRequest = async (customer: Customer) => {
    if (!confirm(`Tolak permintaan member dari ${customer.name}?`)) return;
    await api.put(`/manage/customers/${customer.id}`, { reject_request: true });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Kelola Pelanggan</h1>
      <p className="mt-1 text-sm text-slate-400">
        Basis pelanggan yang pernah booking di venue Anda, atau sedang mengajukan permintaan member.
      </p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-500">Memuat…</p>}
        {!loading && customers.length === 0 && <p className="text-sm text-slate-500">Belum ada pelanggan.</p>}
        {customers.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  {c.is_member && (
                    <Badge tone="success">
                      Member
                      {c.membership_expires_at &&
                        ` — s.d. ${new Date(c.membership_expires_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}`}
                    </Badge>
                  )}
                  {!c.is_member && c.membership_requested_at && (
                    <Badge tone="danger">
                      Permintaan Member — {new Date(c.membership_requested_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {c.email} · {c.phone}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.bookings_count} booking · {rupiah(c.total_spent)} total belanja
                  {c.last_booking_at && (
                    <> · terakhir {new Date(c.last_booking_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setExpandedId((cur) => (cur === c.id ? null : c.id))}
                  className="text-xs font-semibold text-[#1d5fc4] hover:underline"
                >
                  {expandedId === c.id ? 'Tutup Riwayat' : 'Lihat Riwayat'}
                </button>
                {c.is_member ? (
                  <>
                    <button onClick={() => setMember(c, true)} className="text-xs font-semibold text-[#1d5fc4] hover:underline">
                      Perpanjang 1 Bulan
                    </button>
                    <button onClick={() => setMember(c, false)} className="text-xs font-semibold text-slate-400 hover:underline">
                      Batalkan Member
                    </button>
                  </>
                ) : c.membership_requested_at ? (
                  <>
                    <button onClick={() => setMember(c, true)} className="text-xs font-semibold text-emerald-400 hover:underline">
                      ACC Jadi Member
                    </button>
                    <button onClick={() => rejectRequest(c)} className="text-xs font-semibold text-rose-400 hover:underline">
                      Tolak
                    </button>
                  </>
                ) : (
                  <button onClick={() => setMember(c, true)} className="text-xs font-semibold text-slate-300 hover:underline">
                    Jadikan Member (1 Bulan)
                  </button>
                )}
              </div>
            </div>
            {expandedId === c.id && <CustomerHistory customerId={c.id} />}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CustomerHistory({ customerId }: { customerId: number }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: CustomerDetail }>(`/manage/customers/${customerId}`)
      .then((res) => setDetail(res.data))
      .finally(() => setLoading(false));
  }, [customerId]);

  return (
    <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
      {loading && <p className="text-xs text-slate-500">Memuat riwayat…</p>}
      {!loading && detail?.bookings.length === 0 && <p className="text-xs text-slate-500">Belum ada booking.</p>}
      {detail?.bookings.map((b: Booking) => (
        <div key={b.id} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-xs">
          <span className="text-slate-300">
            {b.court?.venue?.name} — {b.court?.name} ·{' '}
            {new Date(b.starts_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
          </span>
          <Badge tone={STATUS_TONE[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
        </div>
      ))}
    </div>
  );
}
