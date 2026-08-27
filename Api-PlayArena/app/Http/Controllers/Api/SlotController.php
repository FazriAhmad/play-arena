<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 04 — kalender ketersediaan. Publik (buat pelanggan cek jadwal
 * sebelum booking) sekaligus dipakai Owner/Staff pas kelola blokir slot.
 * Ini murni buat UX (biar orang tidak coba klik slot yang kelihatan
 * kosong tapi sudah diambil) — sumber kebenaran anti-bentrok tetap
 * exclusion constraint di tabel bookings (Modul 05).
 */
class SlotController extends Controller
{
    public function index(Request $request, Court $court): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $venue = $court->venue;
        $date = Carbon::parse($data['date'], config('app.timezone'));
        $now = Carbon::now(config('app.timezone'));

        $dayStart = $date->copy()->startOfDay();
        $dayEnd = $date->copy()->endOfDay();

        $bookings = $court->bookings()
            ->whereIn('status', Booking::ACTIVE_STATUSES)
            ->where('starts_at', '<', $dayEnd)
            ->where('ends_at', '>', $dayStart)
            ->get(['starts_at', 'ends_at', 'status']);

        $blocks = $court->blockedSlots()
            ->where('starts_at', '<', $dayEnd)
            ->where('ends_at', '>', $dayStart)
            ->get(['starts_at', 'ends_at', 'reason']);

        $slots = [];
        for ($hour = $venue->open_hour; $hour < $venue->close_hour; $hour++) {
            $slotStart = $date->copy()->setTime($hour, 0);
            $slotEnd = $slotStart->copy()->addHour();

            $overlaps = fn ($start, $end) => $slotStart->lt($end) && $start->lt($slotEnd);

            if ($slotStart->lt($now)) {
                $slots[] = ['hour' => $hour, 'state' => 'past', 'label' => 'Sudah lewat'];

                continue;
            }

            $block = $blocks->first(fn ($b) => $overlaps($b->starts_at, $b->ends_at));
            if ($block) {
                $slots[] = ['hour' => $hour, 'state' => 'blocked', 'label' => $block->reason];

                continue;
            }

            $booking = $bookings->first(fn ($b) => $overlaps($b->starts_at, $b->ends_at));
            if ($booking) {
                $label = $booking->status === 'menunggu_acc' ? 'Menunggu konfirmasi' : 'Terisi';
                $slots[] = ['hour' => $hour, 'state' => 'booked', 'label' => $label];

                continue;
            }

            $slots[] = ['hour' => $hour, 'state' => 'available', 'label' => 'Tersedia'];
        }

        return response()->json(['data' => $slots]);
    }
}
