import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Eye, Search, X } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Booking, BookingStatus } from '../../lib/types';
import { fmtDateLong, hourLabel, rupiah } from '../../lib/utils';
import { Button, Card, Modal, Select, SectionHeading, Input, useToast } from '../../components/ui';
import { PaymentBadge, StatusBadge } from '../../components/StatusBadges';
import { InvoiceSheet } from '../../components/InvoiceSheet';

const STATUS_TABS: { id: BookingStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'confirmed', label: 'Terkonfirmasi' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
  { id: 'rejected', label: 'Ditolak' },
];

export const AdminBookingsPage = () => {
  const { state, dispatch, courtById, venueById, customerById } = useStore();
  const { push } = useToast();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];

  const [statusTab, setStatusTab] = useState<BookingStatus | 'all'>('pending');
  const [venueFilter, setVenueFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Booking | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);

  const scoped = useMemo(
    () => state.bookings.filter((b) => myVenueIds.includes(b.venueId)),
    [state.bookings, myVenueIds],
  );

  const filtered = useMemo(() => {
    return scoped
      .filter((b) => statusTab === 'all' || b.status === statusTab)
      .filter((b) => venueFilter === 'all' || b.venueId === venueFilter)
      .filter((b) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          b.code.toLowerCase().includes(q) ||
          customerById(b.customerId)?.name.toLowerCase().includes(q) ||
          courtById(b.courtId)?.name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.date + a.startHour < b.date + b.startHour ? 1 : -1));
  }, [scoped, statusTab, venueFilter, query, customerById, courtById]);

  const approve = (b: Booking) => {
    dispatch({ type: 'PATCH_BOOKING', id: b.id, patch: { status: 'confirmed' }, log: 'Booking disetujui admin' });
    push(`Booking ${b.code} dikonfirmasi`);
  };

  const reject = () => {
    if (!rejectTarget) return;
    dispatch({
      type: 'PATCH_BOOKING',
      id: rejectTarget.id,
      patch: { status: 'rejected', paymentStatus: rejectTarget.paidAmount > 0 ? 'refunded' : 'unpaid' },
      log: 'Booking ditolak admin, dana dikembalikan penuh',
    });
    push(`Booking ${rejectTarget.code} ditolak & refund diproses`);
    setRejectTarget(null);
  };

  const counts = {
    pending: scoped.filter((b) => b.status === 'pending').length,
    confirmed: scoped.filter((b) => b.status === 'confirmed').length,
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Operasional"
        title="Kelola Semua Booking"
        description={`${counts.pending} booking menunggu persetujuan, ${counts.confirmed} sudah terkonfirmasi.`}
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusTab(t.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusTab === t.id ? 'bg-neon-400 text-ink-950' : 'bg-white/5 text-white/55 hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="!w-auto">
            <option value="all">Semua Venue</option>
            {state.venues
              .filter((v) => myVenueIds.includes(v.id))
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </Select>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari kode/nama..." className="w-52 pl-8" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Lapangan</th>
                <th className="px-4 py-3">Jadwal</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pembayaran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{b.code}</td>
                  <td className="px-4 py-3 font-medium text-white">{customerById(b.customerId)?.name}</td>
                  <td className="px-4 py-3 text-white/60">{courtById(b.courtId)?.name}</td>
                  <td className="px-4 py-3 text-white/60">
                    {fmtDateLong(b.date)}
                    <br />
                    <span className="text-xs text-white/40">
                      {hourLabel(b.startHour)}–{hourLabel(b.startHour + b.durationHours)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{rupiah(b.total)}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={b.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setDetail(b)} className="rounded-lg border border-white/12 p-1.5 text-white/60 hover:text-white">
                        <Eye size={14} />
                      </button>
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => approve(b)} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setRejectTarget(b)} className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20">
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-white/40">
                    Tidak ada booking yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Booking" wide>
        {detail && (
          <div className="space-y-5">
            <InvoiceSheet booking={detail} />
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Riwayat Aktivitas</p>
              <div className="space-y-2">
                {detail.logs.map((l, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                    <span className="text-white/60">{l.action}</span>
                    <span className="shrink-0 text-white/35">{new Date(l.at).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
            {detail.status === 'pending' && (
              <div className="flex justify-end gap-2">
                <Button variant="danger" onClick={() => { setRejectTarget(detail); setDetail(null); }}>
                  Tolak Booking
                </Button>
                <Button
                  onClick={() => {
                    approve(detail);
                    setDetail(null);
                  }}
                >
                  Setujui Booking
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Tolak Booking?">
        {rejectTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/8 p-3 text-sm text-amber-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Menolak booking akan mengembalikan dana pelanggan 100% secara otomatis.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>
                Batal
              </Button>
              <Button variant="danger" onClick={reject}>
                Ya, Tolak & Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
