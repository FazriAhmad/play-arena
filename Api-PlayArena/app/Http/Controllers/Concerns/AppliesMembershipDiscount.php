<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use App\Models\Venue;

/**
 * Modul 21 — diskon member otomatis (tanpa kode voucher), berdiri sendiri
 * dari diskon voucher Modul 14 (dua-duanya bisa dipakai bersamaan, dijumlah
 * lalu di-cap ke subtotal). Dipakai di jalur booking online & reschedule —
 * bukan walk-in, karena walk-in biasanya tamu tanpa akun (guest_name).
 */
trait AppliesMembershipDiscount
{
    protected function resolveMemberDiscount(User $user, Venue $venue, int $subtotal): int
    {
        if (! $user->is_member || ! $user->membership_expires_at?->isFuture()) {
            return 0;
        }

        $plan = $venue->owner->membershipPlan;
        if (! $plan || ! $plan->is_active) {
            return 0;
        }

        return (int) round($subtotal * $plan->discount_percent / 100);
    }
}
