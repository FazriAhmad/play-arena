<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['owner_id', 'name', 'city', 'address', 'admin_wa', 'bank_name', 'bank_account_number', 'bank_account_holder', 'qris_image_url', 'lat', 'lng', 'open_hour', 'close_hour', 'booking_hold_minutes', 'full_refund_hours', 'is_active'])]
class Venue extends Model
{
    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'venue_staff');
    }

    public function courts(): HasMany
    {
        return $this->hasMany(Court::class);
    }
}
