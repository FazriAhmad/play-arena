import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, CreditCard, ReceiptText, Wallet } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Booking } from '../../lib/types';
import { fmtDateShort, fmtDateTime, hourLabel, rupiah } from '../../lib/utils';
import { Button, Card, Modal, SectionHeading, Tabs, useToast } from '../../components/ui';
import { PaymentBadge } from '../../components/StatusBadges';

export const AdminPaymentsPage = () => {
  const { state, dispatch, courtById, customerById } = useStore();
  const { push } = useToast();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];
  const [tab, setTab] = useState<'menunggu' | 'riwayat'>('menunggu');
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);

  const scoped = useMemo(
    () => state.bookings.filter((b) => myVenueIds.includes(b.venueId)),
    [state.bookings, myVenueIds],
  );

  const waiting = scoped
    .filter((b) => b.paymentStatus === 'awaiting_verification')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const history = scoped
    .filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'dp_paid' || b.paymentStatus === 'refunded')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 40);

  const totalPending = waiting.reduce((s, b) => s + b.paidAmount, 0);

  const confirmPayment = () => {
    if (!confirmTarget) return;
    dispatch({
      type: 'PATCH_BOOKING',
      id: confirmTarget.id,
      patch: {
        paymentStatus: confirmTarget.paymentMode === 'dp' ? 'dp_paid' : 'paid',
        status: confirmTarget.status === 'pending' ? 'confirmed' : confirmTarget.status,
      },
      log: `Pembayaran dikonfirmasi manual oleh ${staff?.name ?? 'admin'}`,
    });
    push(`Pembayaran ${confirmTarget.code} dikonfirmasi`);
    setConfirmTarget(null);
  };

  const List = ({ items, pending }: { items: Booking[]; pending: boolean }) => (
    <div className="space-y-3">
      {items.map((b) => {
        const court = courtById(b.courtId);
        const customer = customerById(b.customerId);
        return (
          <Card key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/60">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {customer?.name} · {b.code}
                </p>
                <p className="text-xs text-white/45">
                  {court?.name} · {fmtDateShort(b.date)} {hourLabel(b.startHour)} · {b.paymentMethod ?? '—'}
                </p>
                <p className="text-[11px] text-white/35">Diajukan {fmtDateTime(b.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-display text-base font-bold text-white">{rupiah(b.paidAmount)}</p>
                <PaymentBadge status={b.paymentStatus} />
              </div>
              {pending && (
                <Button size="sm" onClick={() => setConfirmTarget(b)}>
                  <CheckCircle2 size={13} /> Konfirmasi
                </Button>
              )}
            </div>
          </Card>
        );
      })}
      {items.length === 0 && (
        <Card className="p-10 text-center text-sm text-white/40">Tidak ada data pembayaran.</Card>
      )}
    </div>
  );

  return (
    <div>
      <SectionHeading
        eyebrow="Keuangan"
        title="Konfirmasi Pembayaran"
        description="Verifikasi bukti transfer/pembayaran online sebelum booking dikonfirmasi penuh."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Menunggu Verifikasi</p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-300">{waiting.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Nilai Tertahan</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{rupiah(totalPending)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Terverifikasi (riwayat)</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-300">{history.length}</p>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: 'menunggu', label: 'Menunggu Verifikasi', count: waiting.length },
          { id: 'riwayat', label: 'Riwayat', count: history.length },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-5"
      />

      {tab === 'menunggu' ? <List items={waiting} pending /> : <List items={history} pending={false} />}

      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Konfirmasi Pembayaran">
        {confirmTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Kode Booking</span>
                <span className="font-mono text-white">{confirmTarget.code}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Metode</span>
                <span className="text-white">{confirmTarget.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Jumlah</span>
                <span className="text-white">{rupiah(confirmTarget.paidAmount)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/15 p-3 text-white/40">
                <ReceiptText size={16} /> Bukti pembayaran terlampir (simulasi)
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-white/40">
              <Clock size={13} /> Setelah dikonfirmasi, status booking otomatis berubah menjadi terkonfirmasi & notifikasi terkirim ke pelanggan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
                Batal
              </Button>
              <Button onClick={confirmPayment}>
                <Wallet size={15} /> Konfirmasi Pembayaran
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
