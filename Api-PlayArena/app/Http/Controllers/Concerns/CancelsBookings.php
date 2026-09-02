<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Booking;
use App\Models\Refund;

/**
 * Modul 09 — dipakai dua jalur: pelanggan batalkan booking sendiri, dan
 * Staff/Owner batalkan booking (alasan wajib). Kebijakan refund berjenjang
 * sama untuk keduanya: kalau sudah ada pembayaran manual yang lunas
 * (Modul 07) dan pembatalan terjadi >= `full_refund_hours` venue sebelum
 * jadwal main, refund penuh (dicatat, diproses admin manual di luar
 * sistem — refund ditransfer balik manual oleh admin). Kurang dari itu,
 * pembayaran hangus sesuai kebijakan venue.
 */
trait CancelsBookings
{
    protected function cancelBooking(Booking $booking, ?string $reason): Booking
    {
        abort_unless(in_array($booking->status, Booking::ACTIVE_STATUSES, true), 422, 'Booking ini tidak bisa dibatalkan.');

        $venue = $booking->court->venue;
        $paidAmount = (int) $booking->payments()->where('status', 'paid')->sum('amount');

        if ($paidAmount > 0) {
            $entitled = now()->diffInHours($booking->starts_at, false) >= $venue->full_refund_hours;

            Refund::create([
                'booking_id' => $booking->id,
                'amount' => $entitled ? $paidAmount : 0,
                'status' => $entitled ? 'entitled' : 'forfeited',
                'reason' => $entitled
                    ? "Dibatalkan ≥{$venue->full_refund_hours} jam sebelum jadwal — refund penuh menunggu diproses admin."
                    : "Dibatalkan <{$venue->full_refund_hours} jam sebelum jadwal — pembayaran hangus sesuai kebijakan venue.",
            ]);
        }

        $booking->update(['status' => 'cancelled', 'cancel_reason' => $reason]);

        return $booking->fresh();
    }
}
