<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Venue;
use Carbon\Carbon;
use Illuminate\Database\QueryException;

/**
 * Logika pembuatan booking dipakai dua jalur: pelanggan booking online
 * (Modul 05) dan Staff/Owner input booking walk-in (Modul 07). Keduanya
 * WAJIB lewat validasi jam operasional + cek blocked_slots yang sama, dan
 * keduanya tetap tunduk pada exclusion constraint `bookings_no_overlap` di
 * database sebagai jaminan terakhir — makanya satu tempat, bukan disalin.
 */
trait CreatesBookings
{
    protected function createBooking(Court $court, Venue $venue, array $data, array $extra): Booking
    {
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
            return $court->bookings()->create($extra + [
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'contact_wa' => $data['contact_wa'],
            ]);
        } catch (QueryException $e) {
            // SQLSTATE 23P01 = exclusion_violation — constraint bookings_no_overlap yang menolak.
            if ($e->getCode() === '23P01') {
                abort(422, 'Slot ini baru saja diambil orang lain. Silakan pilih jam lain.');
            }
            throw $e;
        }
    }
}
