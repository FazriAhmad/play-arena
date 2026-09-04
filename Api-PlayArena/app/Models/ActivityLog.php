<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Jejak aktivitas Staff/Kasir &amp; Petugas Lapangan (ditambah 2026-09-04 atas
 * permintaan user: "admin bisa melihat log aktifitas dari petugas"). Cuma
 * dicatat untuk aksi yang MENGUBAH data — melihat halaman tidak dicatat,
 * supaya lognya tetap berguna dibaca dan tidak tenggelam oleh noise.
 *
 * `user_name` &amp; `user_role` sengaja disalin (denormalisasi) waktu mencatat:
 * kalau akun pelakunya dihapus/ganti role belakangan, riwayatnya tetap
 * menunjukkan siapa &amp; sebagai apa saat aksi itu terjadi.
 */
#[Fillable(['user_id', 'user_name', 'user_role', 'venue_id', 'booking_id', 'action', 'description'])]
class ActivityLog extends Model
{
    /** Catat satu aktivitas. Dipanggil dari controller setelah aksinya berhasil. */
    public static function record(
        User $user,
        string $action,
        string $description,
        ?int $venueId = null,
        ?int $bookingId = null,
    ): void {
        static::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->getRoleNames()->first() ?? '-',
            'venue_id' => $venueId,
            'booking_id' => $bookingId,
            'action' => $action,
            'description' => $description,
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
