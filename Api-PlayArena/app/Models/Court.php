<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['venue_id', 'name', 'sport', 'price_per_hour', 'shuttlecock_price', 'photo_url', 'facilities', 'is_active'])]
class Court extends Model
{
    protected function casts(): array
    {
        return [
            'facilities' => 'array',
            'is_active' => 'boolean',
            // Postgres AVG() balikin string desimal via withAvg('reviews','rating') — cast eksplisit
            // supaya frontend bisa langsung panggil .toFixed() tanpa parse manual.
            'reviews_avg_rating' => 'float',
        ];
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function blockedSlots(): HasMany
    {
        return $this->hasMany(BlockedSlot::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
