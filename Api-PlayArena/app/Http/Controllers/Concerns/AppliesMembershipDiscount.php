<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Booking;
use App\Models\Court;
use App\Models\MembershipPlan;
use App\Models\User;
use App\Models\Venue;
use Carbon\Carbon;

/**
 * Modul 21 — diskon member otomatis (tanpa kode voucher), berdiri sendiri
 * dari diskon voucher Modul 14 (dua-duanya bisa dipakai bersamaan, dijumlah
 * lalu di-cap ke subtotal). Dipakai di jalur booking online & reschedule —
 * bukan walk-in, karena walk-in biasanya tamu tanpa akun (guest_name).
 *
 * Khusus lapangan badminton, plan bisa punya kuota booking GRATIS per
 * minggu/bulan (fitur terpisah dari diskon persen) — dicek DULU sebelum
 * jatuh ke diskon persen biasa.
 */
trait AppliesMembershipDiscount
{
    protected function resolveMemberDiscount(
        User $user,
        Court $court,
        Venue $venue,
        int $subtotal,
        string $date,
        int $startHour,
        int $durationHours,
        ?int $excludeBookingId = null
    ): int {
        if (! $user->is_member || ! $user->membership_expires_at?->isFuture()) {
            return 0;
        }

        $plan = $venue->owner->membershipPlan;
        if (! $plan || ! $plan->is_active) {
            return 0;
        }

        if (
            $court->sport === 'Bulu Tangkis'
            && $plan->badminton_quota_hours_per_week
            && $plan->badminton_quota_sessions_per_month
        ) {
            $startsAt = Carbon::parse($date, config('app.timezone'))->setTime($startHour, 0);
            if ($this->withinBadmintonQuota($user, $venue, $startsAt, $durationHours, $plan, $excludeBookingId)) {
                return $subtotal;
            }
        }

        return (int) round($subtotal * $plan->discount_percent / 100);
    }

    /**
     * Kuota dihitung dari SEMUA venue milik owner ini (membership berlaku
     * bisnis-wide), bukan cuma venue yang sedang di-booking. `$excludeBookingId`
     * dipakai reschedule supaya booking LAMA yang baru mau dibatalkan tidak
     * ikut kehitung dobel di kuota (dia masih 'aktif' saat query ini jalan,
     * karena pembatalannya terjadi setelah discount dihitung).
     */
    private function withinBadmintonQuota(User $user, Venue $venue, Carbon $startsAt, int $durationHours, MembershipPlan $plan, ?int $excludeBookingId = null): bool
    {
        $ownerId = $venue->owner_id;

        $baseQuery = fn () => Booking::where('pelanggan_id', $user->id)
            ->when($excludeBookingId, fn ($q) => $q->where('id', '!=', $excludeBookingId))
            ->whereIn('status', [...Booking::ACTIVE_STATUSES, 'completed'])
            ->whereHas('court', fn ($q) => $q->where('sport', 'Bulu Tangkis')
                ->whereHas('venue', fn ($v) => $v->where('owner_id', $ownerId)));

        $hoursThisWeek = $baseQuery()
            ->whereBetween('starts_at', [$startsAt->copy()->startOfWeek(), $startsAt->copy()->endOfWeek()])
            ->get(['starts_at', 'ends_at'])
            ->sum(fn (Booking $b) => $b->starts_at->diffInHours($b->ends_at));

        $sessionsThisMonth = $baseQuery()
            ->whereBetween('starts_at', [$startsAt->copy()->startOfMonth(), $startsAt->copy()->endOfMonth()])
            ->count();

        return ($hoursThisWeek + $durationHours) <= $plan->badminton_quota_hours_per_week
            && ($sessionsThisMonth + 1) <= $plan->badminton_quota_sessions_per_month;
    }
}
