import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  Split,
  Ticket,
  Wallet,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { EXTRAS, PAYMENT_METHODS } from '../../data/seed';
import { applyVoucher, computeTotals, memberDiscountPct } from '../../lib/pricing';
import {
  addDays,
  buildSlots,
  findConflict as findConflictImport,
  fmtDateLong,
  fmtDateShort,
  hourLabel,
  nextDays,
  rupiah,
  todayISO,
} from '../../lib/utils';
import type { Booking, SplitShare } from '../../lib/types';
import { Badge, Button, Card, Field, Input, Modal, SectionHeading, Toggle, useToast } from '../../components/ui';
import { SlotGrid, SlotLegend } from '../../components/SlotGrid';
import { InvoiceSheet } from '../../components/InvoiceSheet';

export const BookingPage = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, courtById, venueById, customerById } = useStore();
  const { push } = useToast();

  const court = courtById(courtId ?? '');
  const venue = court ? venueById(court.venueId) : undefined;
  const customer = customerById(state.user.customerId ?? '');

  const [date, setDate] = useState(addDays(todayISO(), 1));
  const [duration, setDuration] = useState(1);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);
  const [extraQty, setExtraQty] = useState<Record<string, number>>({});
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherApplied, setVoucherApplied] = useState<{ code: string; discount: number; message: string } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [participants, setParticipants] = useState<{ name: string; amount: number }[]>([
    { name: 'Agus (Teman 1)', amount: 0 },
    { name: 'Dimas (Teman 2)', amount: 0 },
  ]);
  const [paymentMode, setPaymentMode] = useState<'dp' | 'full'>('dp');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [notes, setNotes] = useState('');
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const days = nextDays(14);

  const slots = useMemo(() => {
    if (!court || !venue) return [];
    return buildSlots(venue.openHour, venue.closeHour, date, state.bookings, state.blocks, state.liveHolds, court.id);
  }, [court, venue, date, state.bookings, state.blocks, state.liveHolds]);

  if (!court || !venue) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-2xl font-bold text-white">Lapangan tidak ditemukan</p>
        <Link to="/cari" className="mt-4 inline-block text-neon-400">
          Kembali cari lapangan
        </Link>
      </div>
    );
  }

  const selectedExtras = EXTRAS.filter((e) => extraQty[e.name] > 0).map((e) => ({
    name: e.name,
    qty: extraQty[e.name],
    price: e.price,
  }));

  const preDiscountTotal = court.pricePerHour * duration + selectedExtras.reduce((s, e) => s + e.price * e.qty, 0);
  const memberPct = memberDiscountPct(customer?.tier ?? 'non-member');
  const memberDiscount = memberPct > 0 ? Math.round((preDiscountTotal * memberPct) / 100) : 0;

  let discount = memberDiscount;
  if (voucherApplied) discount += voucherApplied.discount;

  const totals = computeTotals(court.pricePerHour, duration, selectedExtras, discount);

  const recurringDates = useMemo(() => {
    if (!recurring || startHour == null) return [];
    const list: string[] = [];
    let cursor = date;
    while (list.length < recurringWeeks) {
      list.push(cursor);
      cursor = addDays(cursor, 7);
    }
    return list;
  }, [recurring, recurringWeeks, date, startHour]);

  const conflictForSelection = (d: string, h: number) =>
    checkConflict(state, court.id, d, h, duration);

  const primaryConflict = startHour != null ? conflictForSelection(date, startHour) : null;

  const handleVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const voucher = state.vouchers.find((v) => v.code === code);
    const result = applyVoucher(voucher, preDiscountTotal, customer?.tier ?? 'non-member');
    if (result.ok) {
      setVoucherApplied({ code, discount: result.discount, message: result.message });
      setVoucherMsg({ ok: true, text: result.message });
    } else {
      setVoucherApplied(null);
      setVoucherMsg({ ok: false, text: result.message });
    }
  };

  const updateExtra = (name: string, delta: number) => {
    setExtraQty((prev) => {
      const next = Math.max(0, (prev[name] ?? 0) + delta);
      return { ...prev, [name]: next };
    });
  };

  const evenSplit = () => {
    const shareCount = participants.length + 1;
    const per = Math.round(totals.total / shareCount);
    setParticipants((prev) => prev.map((p) => ({ ...p, amount: per })));
  };

  const submit = () => {
    if (startHour == null) {
      push('Pilih jam main terlebih dahulu', 'error');
      return;
    }
    if (primaryConflict) {
      push(primaryConflict, 'error');
      return;
    }
    if (!customer) {
      push('Data pelanggan tidak ditemukan', 'error');
      return;
    }

    const groupId = recurring ? `rec_${Date.now()}` : undefined;
    const targetDates = recurring ? recurringDates : [date];
    const paidAmount = paymentMode === 'dp' ? totals.dpAmount : totals.total;

    const splitWith: SplitShare[] = splitEnabled
      ? participants
          .filter((p) => p.name.trim())
          .map((p) => ({ name: p.name, amount: p.amount, paid: false }))
      : [];

    const created: Booking[] = [];
    let skipped = 0;

    targetDates.forEach((d) => {
      const conflict = checkConflict(state, court.id, d, startHour, duration);
      if (conflict) {
        skipped++;
        return;
      }
      created.push({
        id: `bk_${Math.random().toString(36).slice(2, 10)}`,
        code:
          'LP-' + Math.random().toString(36).slice(2, 6).toUpperCase() + String(Math.floor(Math.random() * 90) + 10),
        venueId: venue.id,
        courtId: court.id,
        customerId: customer.id,
        date: d,
        startHour,
        durationHours: duration,
        status: 'pending',
        paymentStatus: paidAmount > 0 ? 'awaiting_verification' : 'unpaid',
        paymentMode,
        paymentMethod: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label,
        subtotal: totals.subtotal,
        extrasTotal: totals.extrasTotal,
        discount: totals.discount,
        total: totals.total,
        paidAmount,
        voucherCode: voucherApplied?.code,
        splitWith,
        extras: selectedExtras,
        recurring,
        recurringGroupId: groupId,
        notes,
        createdAt: new Date().toISOString(),
        remindersSent: [],
        logs: [{ at: new Date().toISOString(), action: 'Booking dibuat oleh pelanggan', by: customer.name }],
      });
    });

    if (created.length === 0) {
      push('Semua jadwal terpilih ternyata sudah bentrok. Coba jam lain.', 'error');
      return;
    }

    dispatch({ type: 'ADD_BOOKINGS', bookings: created });
    push(
      recurring
        ? `${created.length} booking berulang berhasil dibuat${skipped ? `, ${skipped} bentrok dilewati` : ''}!`
        : 'Booking berhasil dibuat! Menunggu konfirmasi admin.',
    );
    setSuccessBooking(created[0]);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2 text-sm text-white/40">
        <Link to={`/venue/${venue.id}`} className="hover:text-white">
          {venue.name}
        </Link>
        <ChevronRight size={14} />
        <span className="text-white/70">Booking {court.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <img src={court.image} className="h-24 w-full rounded-xl object-cover sm:w-36" alt={court.name} />
              <div>
                <Badge tone="neon" className="mb-1.5">
                  {court.sport}
                </Badge>
                <h1 className="font-display text-xl font-bold text-white">{court.name}</h1>
                <p className="text-sm text-white/45">{venue.name} · {venue.district}</p>
                <p className="mt-1 font-display text-lg font-bold text-neon-300">
                  {rupiah(court.pricePerHour)}
                  <span className="text-xs font-normal text-white/40"> /jam</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading eyebrow="Langkah 1" title="Pilih tanggal & jam main" />

            <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setStartHour(null);
                  }}
                  className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                    date === d ? 'border-neon-400 bg-neon-400 text-ink-950' : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25'
                  }`}
                >
                  {fmtDateShort(d)}
                </button>
              ))}
            </div>

            <div className="mb-5 flex items-center gap-3">
              <span className="text-xs font-semibold text-white/50">Durasi:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    onClick={() => setDuration(h)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                      duration === h ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/50'
                    }`}
                  >
                    {h} jam
                  </button>
                ))}
              </div>
            </div>

            <SlotGrid slots={slots} selectedStart={startHour} durationHours={duration} onSelect={setStartHour} />
            <div className="mt-4">
              <SlotLegend />
            </div>

            {primaryConflict && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {primaryConflict}
              </div>
            )}

            {startHour != null && !primaryConflict && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                <CheckCircle2 size={16} /> {hourLabel(startHour)} – {hourLabel(startHour + duration)} tersedia untuk dipesan
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeading eyebrow="Langkah 2" title="Booking berulang otomatis" description="Aktifkan untuk main rutin tiap minggu di hari & jam yang sama tanpa perlu booking manual ulang." />
            <Toggle
              checked={recurring}
              onChange={setRecurring}
              label="Ulangi booking ini setiap minggu"
              description="Contoh: setiap Senin jam 20:00 — sistem akan otomatis membuat booking untuk beberapa minggu ke depan."
            />
            {recurring && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-white/50">Ulangi selama:</span>
                <div className="flex gap-1.5">
                  {[2, 4, 8, 12].map((w) => (
                    <button
                      key={w}
                      onClick={() => setRecurringWeeks(w)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                        recurringWeeks === w ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/50'
                      }`}
                    >
                      {w} minggu
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recurring && startHour != null && (
              <div className="mt-4 flex flex-wrap gap-2">
                {recurringDates.map((d) => {
                  const c = checkConflict(state, court.id, d, startHour, duration);
                  return (
                    <span
                      key={d}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                        c ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {fmtDateShort(d)} {hourLabel(startHour)} {c ? '· bentrok' : '· ok'}
                    </span>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeading eyebrow="Langkah 3" title="Sewa perlengkapan tambahan (opsional)" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {EXTRAS.map((e) => (
                <div key={e.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-white">{e.name}</p>
                    <p className="text-xs text-white/40">{rupiah(e.price)} /item</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateExtra(e.name, -1)} className="rounded-lg border border-white/15 p-1 text-white/60 hover:text-white">
                      <Minus size={13} />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-white">{extraQty[e.name] ?? 0}</span>
                    <button onClick={() => updateExtra(e.name, 1)} className="rounded-lg border border-white/15 p-1 text-white/60 hover:text-white">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading eyebrow="Langkah 4" title="Split payment (bayar rame-rame)" description="Bagi tagihan ke teman satu tim — masing-masing punya tagihan sendiri." />
            <Toggle checked={splitEnabled} onChange={setSplitEnabled} label="Aktifkan split payment" description="Kamu tetap jadi penanggung jawab booking utama." />
            {splitEnabled && (
              <div className="mt-4 space-y-3">
                {participants.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={p.name}
                      onChange={(e) => {
                        const next = [...participants];
                        next[i] = { ...next[i], name: e.target.value };
                        setParticipants(next);
                      }}
                      placeholder={`Nama teman ${i + 1}`}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={p.amount}
                      onChange={(e) => {
                        const next = [...participants];
                        next[i] = { ...next[i], amount: Number(e.target.value) };
                        setParticipants(next);
                      }}
                      placeholder="Jumlah"
                      className="w-32"
                    />
                    <button
                      onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))}
                      className="rounded-lg border border-white/12 px-2 text-white/40 hover:text-rose-300"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setParticipants([...participants, { name: '', amount: 0 }])}
                  >
                    <Plus size={14} /> Tambah teman
                  </Button>
                  <Button variant="subtle" size="sm" onClick={evenSplit}>
                    <Split size={14} /> Bagi rata otomatis
                  </Button>
                </div>
                <p className="text-xs text-white/40">
                  Total dibagi: {rupiah(participants.reduce((s, p) => s + p.amount, 0))} dari {rupiah(totals.total)} tagihan
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeading eyebrow="Catatan" title="Catatan untuk pengelola (opsional)" />
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: minta net baru, butuh coach, dsb." />
          </Card>
        </div>

        {/* SUMMARY SIDEBAR */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-5 p-5">
            <div>
              <p className="font-display text-sm font-bold text-white">Ringkasan Booking</p>
              <p className="mt-1 text-xs text-white/45">{fmtDateLong(date)}</p>
              <p className="text-xs text-white/45">
                {startHour != null ? `${hourLabel(startHour)} – ${hourLabel(startHour + duration)}` : 'Belum pilih jam'} · {duration} jam
                {recurring && ` · berulang ${recurringWeeks}x`}
              </p>
            </div>

            <div>
              <Field label="Kode Voucher">
                <div className="flex gap-2">
                  <Input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} placeholder="MEMBER15" className="flex-1" />
                  <Button variant="subtle" onClick={handleVoucher}>
                    <Ticket size={14} /> Pakai
                  </Button>
                </div>
              </Field>
              {voucherMsg && (
                <p className={`mt-1.5 text-xs ${voucherMsg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{voucherMsg.text}</p>
              )}
            </div>

            <div className="space-y-1.5 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Sewa lapangan ({duration} jam)</span>
                <span>{rupiah(totals.subtotal)}</span>
              </div>
              {selectedExtras.length > 0 && (
                <div className="flex justify-between text-white/60">
                  <span>Perlengkapan tambahan</span>
                  <span>{rupiah(totals.extrasTotal)}</span>
                </div>
              )}
              {memberDiscount > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>Diskon member ({memberPct}%)</span>
                  <span>-{rupiah(memberDiscount)}</span>
                </div>
              )}
              {voucherApplied && (
                <div className="flex justify-between text-emerald-300">
                  <span>Voucher {voucherApplied.code}</span>
                  <span>-{rupiah(voucherApplied.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                <span>Total{recurring ? ' /sesi' : ''}</span>
                <span>{rupiah(totals.total)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">Metode Pembayaran</p>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMode('dp')}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    paymentMode === 'dp' ? 'border-neon-400 bg-neon-400/10' : 'border-white/12'
                  }`}
                >
                  <p className="text-xs font-bold text-white">DP 30%</p>
                  <p className="text-[11px] text-white/45">{rupiah(totals.dpAmount)}</p>
                </button>
                <button
                  onClick={() => setPaymentMode('full')}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    paymentMode === 'full' ? 'border-neon-400 bg-neon-400/10' : 'border-white/12'
                  }`}
                >
                  <p className="text-xs font-bold text-white">Bayar Penuh</p>
                  <p className="text-[11px] text-white/45">{rupiah(totals.total)}</p>
                </button>
              </div>
              <div className="space-y-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                      paymentMethod === m.id ? 'border-aqua-400/60 bg-aqua-400/10 text-white' : 'border-white/10 text-white/55'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{m.icon}</span> {m.label}
                    </span>
                    {m.fee > 0 && <span className="text-[10px] text-white/35">+{rupiah(m.fee)}</span>}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={submit} disabled={startHour == null}>
              <Wallet size={16} /> Bayar & Konfirmasi Booking
            </Button>
            <p className="flex items-start gap-1.5 text-[11px] text-white/35">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" /> Booking dikonfirmasi otomatis oleh admin dalam beberapa menit. Kebijakan refund berlaku sesuai waktu pembatalan.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={!!successBooking}
        onClose={() => {
          setSuccessBooking(null);
          navigate('/booking-saya');
        }}
        wide
      >
        {successBooking && (
          <div>
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <CheckCircle2 className="text-emerald-300" size={28} />
              <div>
                <p className="font-display text-lg font-bold text-white">Booking berhasil dibuat!</p>
                <p className="text-sm text-white/55">
                  Kode booking <strong>{successBooking.code}</strong> — status menunggu konfirmasi admin.
                </p>
              </div>
            </div>
            <InvoiceSheet booking={successBooking} />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                Cetak Invoice
              </Button>
              <Button
                onClick={() => {
                  setSuccessBooking(null);
                  navigate('/booking-saya');
                }}
              >
                Lihat Booking Saya <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

function checkConflict(
  state: ReturnType<typeof useStore>['state'],
  courtId: string,
  date: string,
  startHour: number,
  duration: number,
) {
  return findConflictImport(state.bookings, state.blocks, state.liveHolds, courtId, date, startHour, duration);
}
