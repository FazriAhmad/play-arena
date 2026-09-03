<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Tiga peran inti (lihat PRD §2): owner (mencakup Owner/Admin), staff
 * (Staff/Kasir), pelanggan. Juga bootstrap 1 akun owner supaya ada yang
 * bisa login pertama kali untuk membuat akun staff & venue.
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 'petugas' (Petugas Lapangan) ditambah 2026-08-29: wewenang operasional
        // sama seperti staff (ACC booking, konfirmasi bayar, blokir slot, lihat
        // jadwal) TAPI tidak boleh buka Laporan Pendapatan & Analitik.
        foreach (['owner', 'staff', 'petugas', 'pelanggan'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $owner = User::firstOrCreate(
            ['email' => 'owner@playarena.test'],
            [
                'name' => 'Owner PlayArena',
                'phone' => '081200000000',
                'password' => 'owner12345',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        if (! $owner->hasRole('owner')) {
            $owner->assignRole('owner');
        }
    }
}
