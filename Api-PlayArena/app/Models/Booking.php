<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['court_id', 'pelanggan_id', 'starts_at', 'ends_at', 'status', 'contact_wa'])]
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

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelanggan_id');
    }
}
