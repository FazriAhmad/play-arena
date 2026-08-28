<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Court;
use App\Models\Promo;

/**
 * Modul 14 — validasi kode voucher, dipakai bareng oleh preview publik
 * (PromoController::preview) dan penerapan sungguhan pas booking dibuat
 * (BookingController::store) supaya aturannya (periode, kuota, syarat
 * minimum, cakupan venue) konsisten di dua tempat.
 */
trait AppliesPromoCode
{
    /** @return array{promo: Promo, discount: int} */
    protected function resolvePromo(string $code, Court $court, int $amount): array
    {
        $promo = Promo::whereRaw('UPPER(code) = ?', [mb_strtoupper($code)])
            ->where('owner_id', $court->venue->owner_id)
            ->where(fn ($q) => $q->whereNull('venue_id')->orWhere('venue_id', $court->venue_id))
            ->first();

        abort_if(! $promo || ! $promo->is_active, 422, 'Kode voucher tidak ditemukan.');

        $now = now();
        abort_if($now->lt($promo->starts_at) || $now->gt($promo->ends_at), 422, 'Voucher ini sudah tidak berlaku.');
        abort_if($promo->quota !== null && $promo->used_count >= $promo->quota, 422, 'Kuota voucher ini sudah habis.');
        abort_if(
            $promo->min_amount !== null && $amount < $promo->min_amount,
            422,
            'Minimal transaksi Rp'.number_format($promo->min_amount, 0, ',', '.').' untuk pakai voucher ini.'
        );

        $discount = $promo->discount_type === 'percent'
            ? (int) round($amount * $promo->value / 100)
            : min($promo->value, $amount);

        return ['promo' => $promo, 'discount' => $discount];
    }
}
