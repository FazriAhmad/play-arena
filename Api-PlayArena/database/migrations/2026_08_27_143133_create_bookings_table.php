<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Modul 05 — jantung anti-bentrok. Bukan cuma tabel biasa: constraint
     * EXCLUDE di bawah membuat PostgreSQL sendiri yang menolak dua booking
     * aktif (menunggu_acc/menunggu_bayar/confirmed) yang rentang waktunya
     * overlap pada lapangan yang sama — atomik, tidak bisa ditembus lewat
     * dua request paralel yang lolos validasi aplikasi bersamaan.
     */
    public function up(): void
    {
        // btree_gist dibutuhkan supaya operator "=" (buat court_id, tipe
        // integer biasa) bisa dipakai berdampingan dengan "&&" (overlap
        // range) di dalam satu index GIST.
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pelanggan_id')->constrained('users')->cascadeOnDelete();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            // menunggu_acc | menunggu_bayar | confirmed | rejected | cancelled | completed
            $table->string('status')->default('menunggu_acc');
            $table->string('contact_wa');
            $table->timestamps();
        });

        DB::statement(<<<'SQL'
            ALTER TABLE bookings
            ADD CONSTRAINT bookings_no_overlap
            EXCLUDE USING gist (
                court_id WITH =,
                tstzrange(starts_at, ends_at, '[)') WITH &&
            )
            WHERE (status IN ('menunggu_acc', 'menunggu_bayar', 'confirmed'))
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
