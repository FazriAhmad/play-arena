<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Modul 08 — booking "confirmed" yang jam mainnya sudah lewat ditandai
 * "completed", supaya riwayat pelanggan (akan datang/selesai/dibatalkan)
 * akurat dan Modul 13 (Rating & Review, hanya buat booking selesai)
 * punya status yang bisa diandalkan nanti.
 */
#[Signature('bookings:mark-completed')]
#[Description('Tandai booking confirmed yang jam mainnya sudah lewat sebagai completed')]
class MarkCompletedBookings extends Command
{
    public function handle(): void
    {
        $count = Booking::where('status', 'confirmed')
            ->where('ends_at', '<=', now())
            ->update(['status' => 'completed']);

        $this->info("{$count} booking ditandai selesai.");
    }
}
