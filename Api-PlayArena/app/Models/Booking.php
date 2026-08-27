<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['court_id', 'pelanggan_id', 'guest_name', 'starts_at', 'ends_at', 'status', 'reject_reason', 'cancel_reason', 'created_by', 'contact_wa'])]
class Booking extends Model
{
    /** Status yang masih "aktif" — ikut dihitung exclusion constraint DB, jangan diubah tanpa menyesuaikan migration. */
    public const ACTIVE_STATUSES = ['menunggu_acc', 'menunggu_bayar', 'confirmed'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    /** Nullable — booking walk-in (Modul 07) tidak punya akun pelanggan, pakai guest_name. */
    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelanggan_id');
    }

    /** Staff/Owner yang membuat booking walk-in ini. Null untuk booking online pelanggan. */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }
}
