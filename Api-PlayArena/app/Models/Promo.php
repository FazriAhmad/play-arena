<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['owner_id', 'venue_id', 'code', 'discount_type', 'value', 'min_amount', 'quota', 'starts_at', 'ends_at', 'is_active'])]
class Promo extends Model
{
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** Nullable — null berarti berlaku semua venue milik owner ini. */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }
}
