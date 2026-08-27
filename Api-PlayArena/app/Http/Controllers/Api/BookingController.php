<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 05 — booking & deteksi bentrok. Endpoint ini paling kritis di
 * seluruh PRD: dua request paralel yang lolos validasi aplikasi bersamaan
 * TETAP tidak boleh berhasil dua-duanya. Validasi blocked_slots di sini
 * cuma pencegahan dini (UX) — jaminan sesungguhnya ada di exclusion
 * constraint `bookings_no_overlap` (lihat migration create_bookings_table).
 */
class BookingController extends Controller
{
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

        $endHour = $data['start_hour'] + $data['duration_hours'];
        abort_if(
            $data['start_hour'] < $venue->open_hour || $endHour > $venue->close_hour,
            422,
            "Venue ini buka jam {$venue->open_hour}:00–{$venue->close_hour}:00."
        );

        $startsAt = Carbon::parse($data['date'], config('app.timezone'))->setTime($data['start_hour'], 0);
        $endsAt = $startsAt->copy()->addHours($data['duration_hours']);

        abort_if($startsAt->lt(now()), 422, 'Tidak bisa booking untuk waktu yang sudah lewat.');

        $blocked = $court->blockedSlots()
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();
        abort_if($blocked, 422, 'Slot ini sedang diblokir pengelola venue.');

        try {
            $booking = $court->bookings()->create([
                'pelanggan_id' => $request->user()->id,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'menunggu_acc',
                'contact_wa' => $data['contact_wa'],
            ]);
        } catch (QueryException $e) {
            // SQLSTATE 23P01 = exclusion_violation — constraint bookings_no_overlap yang menolak.
            if ($e->getCode() === '23P01') {
                abort(422, 'Slot ini baru saja diambil orang lain. Silakan pilih jam lain.');
            }
            throw $e;
        }

        return response()->json(['data' => $booking], 201);
    }

    /** Riwayat booking milik pelanggan yang login — buat verifikasi, detail lengkap ada di Modul 08. */
    public function mine(Request $request): JsonResponse
    {
        $bookings = Booking::where('pelanggan_id', $request->user()->id)
            ->with('court:id,name,sport,price_per_hour,venue_id', 'court.venue:id,name')
            ->orderByDesc('starts_at')
            ->get();

        return response()->json(['data' => $bookings]);
    }
}
