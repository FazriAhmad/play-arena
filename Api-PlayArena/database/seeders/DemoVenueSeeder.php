<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Seeder;

/**
 * Data contoh venue & lapangan supaya direktori punya banyak pilihan olahraga
 * saat demo. Aman dijalankan berulang (`firstOrCreate` per nama), dan TIDAK
 * menyentuh venue/lapangan yang sudah ada — termasuk data rekening/QRIS asli
 * yang diisi owner sendiri.
 */
class DemoVenueSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::role('owner')->orderBy('id')->first();

        if (! $owner) {
            $this->command?->warn('Belum ada akun owner — jalankan RoleSeeder dulu.');

            return;
        }

        foreach ($this->venues() as $venueData) {
            $courts = $venueData['courts'];
            unset($venueData['courts']);

            $venue = Venue::firstOrCreate(
                ['owner_id' => $owner->id, 'name' => $venueData['name']],
                $venueData + ['is_active' => true],
            );

            foreach ($courts as $court) {
                $venue->courts()->firstOrCreate(
                    ['name' => $court['name']],
                    $court + ['is_active' => true],
                );
            }
        }
    }

    /** @return list<array<string, mixed>> */
    private function venues(): array
    {
        return [
            [
                'name' => 'Galaxy Sport Center',
                'city' => 'Jakarta Pusat',
                'address' => 'Jl. Merdeka Raya No.12',
                'admin_wa' => '081234500003',
                'open_hour' => 7,
                'close_hour' => 23,
                'courts' => [
                    ['name' => 'Lapangan Basket A', 'sport' => 'Basket', 'price_per_hour' => 200000, 'facilities' => ['Tribun', 'Parkir', 'Toilet']],
                    ['name' => 'Lapangan Basket B', 'sport' => 'Basket', 'price_per_hour' => 180000, 'facilities' => ['Parkir', 'Toilet']],
                    ['name' => 'Lapangan Voli 1', 'sport' => 'Voli', 'price_per_hour' => 120000, 'facilities' => ['Parkir']],
                    ['name' => 'Lapangan Tenis 1', 'sport' => 'Tenis', 'price_per_hour' => 110000, 'facilities' => ['Lampu Malam', 'Parkir']],
                ],
            ],
            [
                'name' => 'Smash Badminton Hall',
                'city' => 'Jakarta Timur',
                'address' => 'Jl. Pemuda No.45',
                'admin_wa' => '081234500004',
                'open_hour' => 6,
                'close_hour' => 23,
                'courts' => [
                    ['name' => 'Court A', 'sport' => 'Bulu Tangkis', 'price_per_hour' => 90000, 'shuttlecock_price' => 6000, 'facilities' => ['AC', 'Parkir']],
                    ['name' => 'Court B', 'sport' => 'Bulu Tangkis', 'price_per_hour' => 90000, 'shuttlecock_price' => 6000, 'facilities' => ['AC', 'Parkir']],
                    ['name' => 'Court C', 'sport' => 'Bulu Tangkis', 'price_per_hour' => 75000, 'shuttlecock_price' => 6000, 'facilities' => ['Parkir']],
                    ['name' => 'Court D', 'sport' => 'Bulu Tangkis', 'price_per_hour' => 75000, 'shuttlecock_price' => 6000, 'facilities' => ['Parkir']],
                ],
            ],
            [
                'name' => 'Kemang Mini Soccer',
                'city' => 'Jakarta Selatan',
                'address' => 'Jl. Kemang Timur No.88',
                'admin_wa' => '081234500005',
                'open_hour' => 8,
                'close_hour' => 24,
                'courts' => [
                    ['name' => 'Mini Soccer 1', 'sport' => 'Futsal', 'price_per_hour' => 250000, 'facilities' => ['Rumput Sintetis', 'Lampu Malam', 'Kantin']],
                    ['name' => 'Mini Soccer 2', 'sport' => 'Futsal', 'price_per_hour' => 250000, 'facilities' => ['Rumput Sintetis', 'Lampu Malam']],
                ],
            ],
            [
                'name' => 'Pingpong Arena Bekasi',
                'city' => 'Bekasi',
                'address' => 'Jl. Ahmad Yani No.7',
                'admin_wa' => '081234500006',
                'open_hour' => 9,
                'close_hour' => 22,
                'courts' => [
                    ['name' => 'Meja 1', 'sport' => 'Tenis Meja', 'price_per_hour' => 45000, 'facilities' => ['AC']],
                    ['name' => 'Meja 2', 'sport' => 'Tenis Meja', 'price_per_hour' => 45000, 'facilities' => ['AC']],
                    ['name' => 'Meja 3', 'sport' => 'Tenis Meja', 'price_per_hour' => 40000, 'facilities' => []],
                ],
            ],
        ];
    }
}
