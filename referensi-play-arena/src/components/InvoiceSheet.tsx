import { forwardRef } from 'react';
import type { Booking } from '../lib/types';
import { fmtDateLong, fmtDateTime, hourLabel, rupiah } from '../lib/utils';
import { useStore } from '../store/StoreContext';
import { Badge } from './ui';
import { PAYMENT_LABEL, STATUS_LABEL } from './StatusBadges';

export const InvoiceSheet = forwardRef<HTMLDivElement, { booking: Booking }>(({ booking }, ref) => {
  const { courtById, venueById, customerById } = useStore();
  const court = courtById(booking.courtId);
  const venue = venueById(booking.venueId);
  const customer = customerById(booking.customerId);

  return (
    <div ref={ref} className="print-sheet rounded-2xl border border-white/10 bg-ink-900 p-6 text-sm text-white sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-display text-xl font-black">
            Lapak<span className="text-neon-400">Lapangan</span>
          </p>
          <p className="mt-1 text-xs text-white/50">Invoice Booking Lapangan Olahraga</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold">{booking.code}</p>
          <p className="text-xs text-white/50">Dibuat {fmtDateTime(booking.createdAt)}</p>
          <Badge tone="neon" className="mt-2">
            {STATUS_LABEL[booking.status]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-white/40">Pelanggan</p>
          <p className="font-semibold">{customer?.name}</p>
          <p className="text-xs text-white/50">{customer?.email}</p>
          <p className="text-xs text-white/50">{customer?.phone}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-white/40">Lokasi & Jadwal</p>
          <p className="font-semibold">
            {court?.name} · {venue?.name}
          </p>
          <p className="text-xs text-white/50">{fmtDateLong(booking.date)}</p>
          <p className="text-xs text-white/50">
            {hourLabel(booking.startHour)} – {hourLabel(booking.startHour + booking.durationHours)} (
            {booking.durationHours} jam)
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Item</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            <tr>
              <td className="px-3 py-2.5">
                Sewa {court?.name} ({booking.durationHours} jam)
              </td>
              <td className="px-3 py-2.5 text-right">1</td>
              <td className="px-3 py-2.5 text-right">{rupiah(booking.subtotal)}</td>
            </tr>
            {booking.extras.map((e, i) => (
              <tr key={i}>
                <td className="px-3 py-2.5">{e.name}</td>
                <td className="px-3 py-2.5 text-right">{e.qty}</td>
                <td className="px-3 py-2.5 text-right">{rupiah(e.price * e.qty)}</td>
              </tr>
            ))}
            {booking.discount > 0 && (
              <tr>
                <td className="px-3 py-2.5 text-emerald-400">
                  Diskon {booking.voucherCode ? `(${booking.voucherCode})` : ''}
                </td>
                <td className="px-3 py-2.5 text-right text-emerald-400">—</td>
                <td className="px-3 py-2.5 text-right text-emerald-400">-{rupiah(booking.discount)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-end gap-1.5">
        <div className="flex w-full max-w-xs justify-between text-white/60 sm:w-64">
          <span>Total Tagihan</span>
          <span className="font-semibold text-white">{rupiah(booking.total)}</span>
        </div>
        <div className="flex w-full max-w-xs justify-between text-white/60 sm:w-64">
          <span>Sudah Dibayar</span>
          <span className="font-semibold text-emerald-400">{rupiah(booking.paidAmount)}</span>
        </div>
        <div className="flex w-full max-w-xs justify-between border-t border-white/10 pt-1.5 text-base font-bold sm:w-64">
          <span>Sisa Tagihan</span>
          <span className={booking.total - booking.paidAmount > 0 ? 'text-amber-300' : 'text-emerald-400'}>
            {rupiah(Math.max(0, booking.total - booking.paidAmount))}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/40">
        <span>
          Status pembayaran: <strong className="text-white/70">{PAYMENT_LABEL[booking.paymentStatus]}</strong>
          {booking.paymentMethod ? ` · ${booking.paymentMethod}` : ''}
        </span>
        <span>Kebijakan refund berlaku sesuai waktu pembatalan.</span>
      </div>
    </div>
  );
});

InvoiceSheet.displayName = 'InvoiceSheet';
