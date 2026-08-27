<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\CreatesBookings;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        ]);

        $booking = $this->createBooking($court, $venue, $data, [
            'pelanggan_id' => $request->user()->id,
            'status' => 'menunggu_acc',
        ]);

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
        $booking->load(['court:id,name,sport,price_per_hour,venue_id', 'court.venue:id,name,address,city', 'payments']);

        return response()->json(['data' => $booking]);
    }
}
