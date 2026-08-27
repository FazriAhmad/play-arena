<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['venue_id', 'name', 'sport', 'price_per_hour', 'photo_url', 'facilities', 'is_active'])]
class Court extends Model
{
    protected function casts(): array
    {
        return [
            'facilities' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }
}
