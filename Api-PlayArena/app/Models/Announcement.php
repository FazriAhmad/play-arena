<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['owner_id', 'title', 'body', 'target_segment', 'venue_id', 'is_active'])]
class Announcement extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** Nullable — cuma diisi kalau target_segment = venue. */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }
}
