<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Venue;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Modul 05 — booking berstatus "menunggu_acc" yang tidak direspons admin
 * dalam batas waktu venue (default 60 menit, per `venues.booking_hold_minutes`)
 * otomatis dibatalkan supaya slot-nya lepas lagi buat pelanggan lain.
 */
#[Signature('bookings:expire-stale')]
#[Description('Batalkan booking menunggu_acc yang sudah melewati batas waktu venue')]
class ExpireStaleBookings extends Command
{
    public function handle(): void
    {
        $expired = 0;

        Venue::query()->select('id', 'booking_hold_minutes')->chunk(50, function ($venues) use (&$expired) {
            foreach ($venues as $venue) {
                $count = Booking::whereHas('court', fn ($q) => $q->where('venue_id', $venue->id))
                    ->where('status', 'menunggu_acc')
                    ->where('created_at', '<=', now()->subMinutes($venue->booking_hold_minutes))
                    ->update(['status' => 'cancelled']);
                $expired += $count;
            }
        });

        $this->info("{$expired} booking dibatalkan otomatis (melewati batas waktu ACC).");
    }
}
