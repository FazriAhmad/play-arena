<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use App\Models\Venue;

/**
 * Dua level akses venue yang dipakai berulang di beberapa controller:
 * - "Owner" — pemilik venue, satu-satunya yang boleh ubah data lapangan/venue (Modul 03).
 * - "Staff" — Owner ATAU staff yang ditugaskan ke venue itu, boleh kelola
 *   kalender/blokir slot (Modul 04) tapi tidak boleh ubah data master.
 */
trait AuthorizesVenue
{
    protected function authorizeOwner(User $user, Venue $venue): void
    {
        abort_unless($venue->owner_id === $user->id, 403, 'Bukan venue milik Anda.');
    }

    protected function authorizeVenueStaff(User $user, Venue $venue): void
    {
        $allowed = $venue->owner_id === $user->id
            || $venue->staff()->where('users.id', $user->id)->exists();

        abort_unless($allowed, 403, 'Anda tidak ditugaskan ke venue ini.');
    }
}
