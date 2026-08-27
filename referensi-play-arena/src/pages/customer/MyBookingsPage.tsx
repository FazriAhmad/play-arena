import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  Clock3,
  FileText,
  Printer,
  Receipt,
  Repeat,
  Star,
  Users2,
  Wallet,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Booking } from '../../lib/types';
import {
  ADMIN_FEE,
  fmtDateLong,
  hourLabel,
  hoursUntil,
  refundFor,
  rescheduleFee,
  rupiah,
  buildSlots,
  nextDays,
  fmtDateShort,
  addDays,
  todayISO,
} from '../../lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  StarPicker,
  Stars,
  Tabs,
  Textarea,
  useToast,
} from '../../components/ui';
import { PaymentBadge, StatusBadge } from '../../components/StatusBadges';
import { InvoiceSheet } from '../../components/InvoiceSheet';
import { SlotGrid } from '../../components/SlotGrid';

type TabId = 'aktif' | 'riwayat' | 'berulang';

const BookingRow = ({
  booking,
  onInvoice,
  onCancel,
  onReschedule,
  onReview,
  onPayRest,
  onMarkShare,
}: {
  booking: Booking;
  onInvoice: (b: Booking) => void;
  onCancel: (b: Booking) => void;
  onReschedule: (b: Booking) => void;
  onReview: (b: Booking) => void;
  onPayRest: (b: Booking) => void;
  onMarkShare: (b: Booking, idx: number) => void;
}) => {
  const { courtById, venueById } = useStore();
  const court = courtById(booking.courtId);
  const venue = venueById(booking.venueId);
  const remaining = booking.total - booking.paidAmount;
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canReschedule = booking.status === 'confirmed' || booking.status === 'pending';
  const canReview = booking.status === 'completed' && !booking.review;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3.5">
          <img src={court?.image} className="h-16 w-16 shrink-0 rounded-xl object-cover" alt="" />
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <PaymentBadge status={booking.paymentStatus} />
              {booking.recurring && (
                <Badge tone="violet">
                  <Repeat size={11} /> Berulang
                </Badge>
              )}
            </div>
            <p className="font-display text-base font-bold text-white">{court?.name}</p>
            <p className="text-xs text-white/45">{venue?.name}</p>
            <p className="mt-1 text-xs text-white/55">
              {fmtDateLong(booking.date)} · {hourLabel(booking.startHour)}–{hourLabel(booking.startHour + booking.durationHours)}
            </p>
            <p className="mt-0.5 text-[11px] text-white/35">Kode: {booking.code}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-white">{rupiah(booking.total)}</p>
          {remaining > 0 && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
            <p className="text-xs font-semibold text-amber-300">Sisa {rupiah(remaining)}</p>
          )}
        </div>
      </div>

      {booking.splitWith.length > 0 && (
        <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-violet-300">
            <Users2 size={13} /> Split Payment ({booking.splitWith.filter((s) => s.paid).length}/{booking.splitWith.length} lunas)
          </p>
          <div className="space-y-1.5">
            {booking.splitWith.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/60">{s.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white/80">{rupiah(s.amount)}</span>
                  {s.paid ? (
                    <Badge tone="success">Lunas</Badge>
                  ) : (
                    <button
                      onClick={() => onMarkShare(booking, i)}
                      className="rounded-md bg-white/10 px-2 py-0.5 font-semibold text-white/70 hover:bg-neon-400 hover:text-ink-950"
                    >
                      Tandai lunas
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.notes && (
        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/45">Catatan: {booking.notes}</p>
      )}

      {booking.review && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
          <Stars value={booking.review.stars} size={12} />
          <span className="text-xs text-white/50">"{booking.review.comment}"</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
        <Button size="sm" variant="subtle" onClick={() => onInvoice(booking)}>
          <Receipt size={13} /> Invoice
        </Button>
        {remaining > 0 && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
          <Button size="sm" variant="aqua" onClick={() => onPayRest(booking)}>
            <Wallet size={13} /> Bayar Sisa {rupiah(remaining)}
          </Button>
        )}
        {canReschedule && (
          <Button size="sm" variant="outline" onClick={() => onReschedule(booking)}>
            <Clock3 size={13} /> Reschedule
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="danger" onClick={() => onCancel(booking)}>
            <CalendarX2 size={13} /> Batalkan
          </Button>
        )}
        {canReview && (
          <Button size="sm" variant="outline" onClick={() => onReview(booking)}>
            <Star size={13} /> Beri Ulasan
          </Button>
        )}
      </div>
    </Card>
  );
};

export const MyBookingsPage = () => {
  const { state, dispatch, courtById, venueById } = useStore();
  const { push } = useToast();
  const [tab, setTab] = useState<TabId>('aktif');

  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [payBooking, setPayBooking] = useState<Booking | null>(null);

  const [rsDate, setRsDate] = useState(todayISO());
  const [rsHour, setRsHour] = useState<number | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  const myBookings = useMemo(
    () =>
      state.bookings
        .filter((b) => b.customerId === state.user.customerId)
        .sort((a, b) => (a.date + a.startHour < b.date + b.startHour ? 1 : -1)),
    [state.bookings, state.user.customerId],
  );

  const active = myBookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const history = myBookings.filter((b) => ['completed', 'cancelled', 'rejected'].includes(b.status));
  const recurringGroups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    myBookings
      .filter((b) => b.recurring && b.recurringGroupId)
      .forEach((b) => {
        const arr = map.get(b.recurringGroupId!) ?? [];
        arr.push(b);
        map.set(b.recurringGroupId!, arr);
      });
    return Array.from(map.entries());
  }, [myBookings]);

  const list = tab === 'aktif' ? active : tab === 'riwayat' ? history : [];

  const openReschedule = (b: Booking) => {
    setRescheduleBooking(b);
    setRsDate(addDays(todayISO(), 2));
    setRsHour(null);
  };

  const rsSlots = useMemo(() => {
    if (!rescheduleBooking) return [];
    const venue = venueById(rescheduleBooking.venueId);
    if (!venue) return [];
    return buildSlots(venue.openHour, venue.closeHour, rsDate, state.bookings, state.blocks, state.liveHolds, rescheduleBooking.courtId);
  }, [rescheduleBooking, rsDate, state.bookings, state.blocks, state.liveHolds, venueById]);

  const doCancel = () => {
    if (!cancelBooking) return;
    const hrs = hoursUntil(cancelBooking.date, cancelBooking.startHour);
    const rule = refundFor(hrs);
    const refundAmount = Math.max(0, Math.round((cancelBooking.paidAmount * rule.pct) / 100) - (rule.pct > 0 ? ADMIN_FEE : 0));
    dispatch({
      type: 'PATCH_BOOKING',
      id: cancelBooking.id,
      patch: { status: 'cancelled', paymentStatus: cancelBooking.paidAmount > 0 ? 'refunded' : 'unpaid', refundAmount: Math.max(0, refundAmount) },
      log: `Dibatalkan pelanggan · refund ${rule.pct}% (${rupiah(Math.max(0, refundAmount))})`,
    });
    push(`Booking dibatalkan. Refund ${rupiah(Math.max(0, refundAmount))} akan diproses 3-5 hari kerja.`);
    setCancelBooking(null);
  };

  const doReschedule = () => {
    if (!rescheduleBooking || rsHour == null) return;
    const hrs = hoursUntil(rescheduleBooking.date, rescheduleBooking.startHour);
    const feePct = rescheduleFee(hrs);
    const fee = Math.round(rescheduleBooking.total * feePct);
    dispatch({
      type: 'PATCH_BOOKING',
      id: rescheduleBooking.id,
      patch: {
        date: rsDate,
        startHour: rsHour,
        total: rescheduleBooking.total + fee,
        status: 'pending',
      },
      log: `Reschedule ke ${rsDate} ${hourLabel(rsHour)}${fee > 0 ? ` · biaya reschedule ${rupiah(fee)}` : ' · gratis'}`,
    });
    push(fee > 0 ? `Jadwal diubah. Biaya reschedule ${rupiah(fee)} ditambahkan ke tagihan.` : 'Jadwal berhasil diubah tanpa biaya tambahan.');
    setRescheduleBooking(null);
  };

  const doReview = () => {
    if (!reviewBooking) return;
    dispatch({
      type: 'PATCH_BOOKING',
      id: reviewBooking.id,
      patch: { review: { stars: reviewStars, comment: reviewComment, at: new Date().toISOString() } },
    });
    dispatch({
      type: 'ADD_REVIEW',
      review: {
        id: `rv_${Date.now()}`,
        venueId: reviewBooking.venueId,
        courtId: reviewBooking.courtId,
        customerName: state.customers.find((c) => c.id === reviewBooking.customerId)?.name ?? 'Pelanggan',
        stars: reviewStars,
        comment: reviewComment,
        at: new Date().toISOString(),
      },
    });
    push('Terima kasih atas ulasannya!');
    setReviewBooking(null);
    setReviewComment('');
    setReviewStars(5);
  };

  const doPayRest = () => {
    if (!payBooking) return;
    dispatch({
      type: 'PATCH_BOOKING',
      id: payBooking.id,
      patch: { paidAmount: payBooking.total, paymentStatus: 'paid', status: payBooking.status === 'pending' ? 'confirmed' : payBooking.status },
      log: 'Pelunasan sisa tagihan diterima',
    });
    push('Pembayaran sisa tagihan berhasil, booking lunas!');
    setPayBooking(null);
  };

  const markShare = (b: Booking, idx: number) => {
    const next = b.splitWith.map((s, i) => (i === idx ? { ...s, paid: true, paidAt: new Date().toISOString(), method: 'QRIS' } : s));
    dispatch({ type: 'PATCH_BOOKING', id: b.id, patch: { splitWith: next }, log: `${b.splitWith[idx].name} melunasi bagiannya` });
    push(`${b.splitWith[idx].name} telah membayar bagiannya.`);
  };

  const cancelPreview = cancelBooking
    ? refundFor(hoursUntil(cancelBooking.date, cancelBooking.startHour))
    : null;
  const reschedulePreview = rescheduleBooking
    ? rescheduleFee(hoursUntil(rescheduleBooking.date, rescheduleBooking.startHour))
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-white">Booking Saya</h1>
        <p className="mt-1 text-sm text-white/50">Kelola riwayat, invoice, pembayaran, dan jadwal booking-mu.</p>
      </div>

      <Tabs
        tabs={[
          { id: 'aktif', label: 'Aktif', count: active.length },
          { id: 'riwayat', label: 'Riwayat', count: history.length },
          { id: 'berulang', label: 'Berulang', count: recurringGroups.length },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === 'berulang' ? (
        recurringGroups.length === 0 ? (
          <EmptyState icon={<Repeat size={22} />} title="Belum ada booking berulang" description="Aktifkan booking berulang saat memesan lapangan untuk main rutin tiap minggu." />
        ) : (
          <div className="space-y-6">
            {recurringGroups.map(([groupId, items]) => {
              const court = courtById(items[0].courtId);
              return (
                <Card key={groupId} className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-1.5 font-display text-base font-bold text-white">
                        <Repeat size={15} className="text-violet-300" /> {court?.name}
                      </p>
                      <p className="text-xs text-white/45">{items.length} sesi terjadwal</p>
                    </div>
                    <Badge tone="violet">Setiap minggu · {hourLabel(items[0].startHour)}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items
                      .sort((a, b) => (a.date < b.date ? -1 : 1))
                      .map((b) => (
                        <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-sm">
                          <span className="text-white/70">{fmtDateLong(b.date)}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={b.status} />
                            <button onClick={() => setInvoiceBooking(b)} className="text-xs font-semibold text-neon-300 hover:underline">
                              Invoice
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : list.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title={tab === 'aktif' ? 'Belum ada booking aktif' : 'Belum ada riwayat booking'}
          description="Cari lapangan favoritmu dan mulai booking sekarang."
        />
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              onInvoice={setInvoiceBooking}
              onCancel={setCancelBooking}
              onReschedule={openReschedule}
              onReview={setReviewBooking}
              onPayRest={setPayBooking}
              onMarkShare={markShare}
            />
          ))}
        </div>
      )}

      {/* INVOICE MODAL */}
      <Modal open={!!invoiceBooking} onClose={() => setInvoiceBooking(null)} title="Invoice Booking" wide>
        {invoiceBooking && (
          <div>
            <InvoiceSheet ref={printRef} booking={invoiceBooking} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={14} /> Cetak / Simpan PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL MODAL */}
      <Modal open={!!cancelBooking} onClose={() => setCancelBooking(null)} title="Batalkan Booking" subtitle="Kebijakan refund berlaku sesuai waktu pembatalan.">
        {cancelBooking && cancelPreview && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/8 p-4 text-sm text-amber-200">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={15} /> {cancelPreview.label}
              </p>
              <p className="mt-1 text-white/60">Kamu akan menerima refund sebesar {cancelPreview.pct}% dari total yang sudah dibayar.</p>
            </div>
            <div className="space-y-1.5 rounded-xl bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Sudah dibayar</span>
                <span>{rupiah(cancelBooking.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Persentase refund</span>
                <span>{cancelPreview.pct}%</span>
              </div>
              {cancelPreview.pct > 0 && (
                <div className="flex justify-between text-white/60">
                  <span>Biaya admin refund</span>
                  <span>-{rupiah(ADMIN_FEE)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-1.5 text-base font-bold text-white">
                <span>Estimasi dana kembali</span>
                <span className="text-emerald-300">
                  {rupiah(Math.max(0, Math.round((cancelBooking.paidAmount * cancelPreview.pct) / 100) - (cancelPreview.pct > 0 ? ADMIN_FEE : 0)))}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-white/40">
              {[
                '≥ 48 jam sebelum jadwal: refund 100%',
                '24–48 jam sebelum jadwal: refund 75%',
                '12–24 jam sebelum jadwal: refund 50%',
                '< 12 jam sebelum jadwal: tidak ada refund',
              ].map((t) => (
                <p key={t}>• {t}</p>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCancelBooking(null)}>
                Batal
              </Button>
              <Button variant="danger" onClick={doCancel}>
                Ya, Batalkan Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal open={!!rescheduleBooking} onClose={() => setRescheduleBooking(null)} title="Reschedule Booking" subtitle="Pilih jadwal baru untuk lapangan yang sama." wide>
        {rescheduleBooking && (
          <div className="space-y-4">
            {reschedulePreview !== null && reschedulePreview > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/8 p-3 text-sm text-amber-200">
                <AlertTriangle size={15} /> Reschedule mendekati jadwal (H-{Math.round(hoursUntil(rescheduleBooking.date, rescheduleBooking.startHour))} jam) dikenakan biaya {Math.round(reschedulePreview * 100)}% dari total booking.
              </div>
            )}
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {nextDays(14, todayISO()).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setRsDate(d);
                    setRsHour(null);
                  }}
                  className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                    rsDate === d ? 'border-neon-400 bg-neon-400 text-ink-950' : 'border-white/10 text-white/55'
                  }`}
                >
                  {fmtDateShort(d)}
                </button>
              ))}
            </div>
            <SlotGrid slots={rsSlots} selectedStart={rsHour} durationHours={rescheduleBooking.durationHours} onSelect={setRsHour} compact />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRescheduleBooking(null)}>
                Batal
              </Button>
              <Button onClick={doReschedule} disabled={rsHour == null}>
                Konfirmasi Reschedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REVIEW MODAL */}
      <Modal open={!!reviewBooking} onClose={() => setReviewBooking(null)} title="Beri Ulasan Lapangan">
        {reviewBooking && (
          <div className="space-y-4">
            <Field label="Rating kamu">
              <StarPicker value={reviewStars} onChange={setReviewStars} />
            </Field>
            <Field label="Ceritakan pengalamanmu">
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Lapangan bersih, kasir ramah, dll..." />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewBooking(null)}>
                Batal
              </Button>
              <Button onClick={doReview} disabled={!reviewComment.trim()}>
                <CheckCircle2 size={15} /> Kirim Ulasan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* PAY REMAINING MODAL */}
      <Modal open={!!payBooking} onClose={() => setPayBooking(null)} title="Lunasi Sisa Tagihan">
        {payBooking && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Total tagihan</span>
                <span>{rupiah(payBooking.total)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Sudah dibayar (DP)</span>
                <span>{rupiah(payBooking.paidAmount)}</span>
              </div>
              <div className="mt-1.5 flex justify-between border-t border-white/10 pt-1.5 text-base font-bold text-white">
                <span>Sisa yang harus dibayar</span>
                <span className="text-amber-300">{rupiah(payBooking.total - payBooking.paidAmount)}</span>
              </div>
            </div>
            <p className="text-xs text-white/40">Simulasi pembayaran via QRIS / Virtual Account — status akan langsung terverifikasi otomatis.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPayBooking(null)}>
                Batal
              </Button>
              <Button onClick={doPayRest}>
                <Wallet size={15} /> Bayar {rupiah(payBooking.total - payBooking.paidAmount)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
