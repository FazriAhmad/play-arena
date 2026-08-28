<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Modul 21 — membership berjangka 1 bulan (diisi CustomerController::update),
 * dicabut otomatis begitu lewat masa berlaku supaya diskon member tidak
 * terus jalan tanpa perpanjangan (mirip pola bookings:expire-stale).
 */
#[Signature('memberships:expire-stale')]
#[Description('Cabut status member yang sudah lewat masa berlaku bulanan')]
class ExpireStaleMemberships extends Command
{
    public function handle(): void
    {
        $count = User::where('is_member', true)
            ->whereNotNull('membership_expires_at')
            ->where('membership_expires_at', '<=', now())
            ->update(['is_member' => false, 'membership_expires_at' => null]);

        $this->info("{$count} membership dicabut otomatis (lewat masa berlaku).");
    }
}
