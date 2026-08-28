<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'phone', 'password', 'is_active', 'is_member', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'is_member' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /** Venue tempat staff ini ditugaskan. Kosong untuk role owner/pelanggan. */
    public function venues(): BelongsToMany
    {
        return $this->belongsToMany(Venue::class, 'venue_staff');
    }

    /** Venue milik user ini (role owner). */
    public function ownedVenues(): HasMany
    {
        return $this->hasMany(Venue::class, 'owner_id');
    }

    /** Voucher/promo milik user ini (role owner). */
    public function promos(): HasMany
    {
        return $this->hasMany(Promo::class, 'owner_id');
    }

    /** Booking yang dipesan user ini sebagai pelanggan. Kosong untuk role owner/staff. */
    public function bookingsAsCustomer(): HasMany
    {
        return $this->hasMany(Booking::class, 'pelanggan_id');
    }

    /** Pengumuman yang dibuat user ini (role owner). */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'owner_id');
    }
}
