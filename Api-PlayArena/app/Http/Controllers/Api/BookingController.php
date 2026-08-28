<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AppliesPromoCode;
use App\Http\Controllers\Concerns\CancelsBookings;
use App\Http\Controllers\Concerns\CreatesBookings;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Modul 05 — booking & deteksi bentrok. Endpoint ini paling kritis di
 * seluruh PRD: dua request paralel yang lolos validasi aplikasi bersamaan
 * TETAP tidak boleh berhasil dua-duanya. Validasi blocked_slots di sini
 * cuma pencegahan dini (UX) — jaminan sesungguhnya ada di exclusion
 * constraint `bookings_no_overlap` (lihat migration create_bookings_table,
 * dipakai bersama lewat trait CreatesBookings).
 */
class BookingController extends Controller
{
    use AppliesPromoCode;
    use CancelsBookings;
    use CreatesBookings;

    public function store(Request $request, Court $court): JsonResponse
    {
        abort_unless($court->is_active, 404);
        $venue = $court->venue;

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'start_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'contact_wa' => ['required', 'string', 'max:30'],
            'promo_code' => ['nullable', 'string', 'max:50'],
            'shuttlecock_qty' => ['nullable', 'integer', 'min:0', 'max:50'],
        ]);

        $extra = [
            'pelanggan_id' => $request->user()->id,
            'status' => 'menunggu_acc',
        ];

        $promo = null;
        if (! empty($data['promo_code'])) {
            $result = $this->resolvePromo($data['promo_code'], $court, $court->price_per_hour * $data['duration_hours']);
            $promo = $result['promo'];
            $extra['promo_code'] = $promo->code;
            $extra['discount_amount'] = $result['discount'];
        }

        // Booking dibuat dulu (bisa gagal kena exclusion constraint) — kuota
        // voucher baru dipakai setelah booking BENAR-BENAR berhasil, supaya
        // percobaan yang gagal bentrok tidak ikut menghabiskan kuota.
        $booking = $this->createBooking($court, $venue, $data, $extra);
        $promo?->increment('used_count');

        return response()->json(['data' => $booking], 201);
    }

    /** Riwayat booking milik pelanggan yang login (Modul 08) — akan datang/selesai/dibatalkan dikelompokkan di frontend. */
    public function mine(Request $request): JsonResponse
    {
        $bookings = Booking::where('pelanggan_id', $request->user()->id)
            ->with('court:id,name,sport,price_per_hour,venue_id', 'court.venue:id,name')
            ->orderByDesc('starts_at')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    /** Detail satu booking + riwayat pembayaran — dasar halaman invoice (Modul 08). Hanya pemilik booking. */
    public function show(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->pelanggan_id === $request->user()->id, 403, 'Bukan booking Anda.');
        $booking->load(['court:id,name,sport,price_per_hour,venue_id', 'court.venue:id,name,address,city,admin_wa,open_hour,close_hour', 'payments', 'refunds', 'review']);

        return response()->json(['data' => $booking]);
    }

    /** Modul 09 — pelanggan batalkan booking sendiri. Alasan opsional (beda dari pembatalan Staff/Owner yang wajib). */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->pelanggan_id === $request->user()->id, 403, 'Bukan booking Anda.');
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        $booking = $this->cancelBooking($booking, $data['reason'] ?? null);

        return response()->json(['data' => $booking->load('refunds')]);
    }

    /**
     * Modul 09 — reschedule ke slot lain, tunduk penuh pada validasi Modul 05
     * (jam operasional, blocked_slots, exclusion constraint) lewat
     * CreatesBookings — tidak ada jalur pintas. Booking lama & baru
     * dibungkus satu transaksi: kalau slot baru gagal (bentrok/diblokir),
     * booking lama TIDAK ikut batal.
     *
     * Cuma untuk booking yang belum dibayar (menunggu_acc/menunggu_bayar).
     * Booking yang sudah confirmed (sudah dibayar) harus dibatalkan dulu
     * (tunduk kebijakan refund Modul 09) baru booking ulang — supaya tidak
     * perlu logika pemindahan pembayaran yang tidak disebut di PRD.
     */
    public function reschedule(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->pelanggan_id === $request->user()->id, 403, 'Bukan booking Anda.');
        abort_unless(
            in_array($booking->status, ['menunggu_acc', 'menunggu_bayar'], true),
            422,
            'Booking yang sudah dibayar tidak bisa dijadwal ulang langsung — batalkan dulu (tunduk kebijakan refund), lalu booking ulang.'
        );

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'start_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'contact_wa' => ['required', 'string', 'max:30'],
        ]);

        $court = $booking->court;
        $venue = $court->venue;

        // Shuttlecock (kalau ada) ikut ke jadwal baru sama seperti voucher — dihitung
        // ulang lewat createBooking() pakai harga shuttlecock TERKINI, bukan yang dibekukan
        // di booking lama, konsisten dengan cara harga per-jam juga selalu dari data lapangan sekarang.
        $data['shuttlecock_qty'] = $booking->shuttlecock_qty;

        $new = DB::transaction(function () use ($booking, $court, $venue, $data) {
            $booking->update(['status' => 'cancelled', 'cancel_reason' => 'Dijadwalkan ulang oleh pelanggan.']);

            return $this->createBooking($court, $venue, $data, [
                'pelanggan_id' => $booking->pelanggan_id,
                'status' => 'menunggu_acc',
                // Voucher yang sudah dipakai tetap ikut ke jadwal baru — reschedule
                // memindahkan booking yang sama, bukan transaksi baru.
                'promo_code' => $booking->promo_code,
                'discount_amount' => $booking->discount_amount,
            ]);
        });

        return response()->json(['data' => $new], 201);
    }
}
