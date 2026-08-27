<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['booking_id', 'method', 'amount', 'status', 'reference', 'confirmed_by', 'confirmed_at'])]
class Payment extends Model
{
    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
