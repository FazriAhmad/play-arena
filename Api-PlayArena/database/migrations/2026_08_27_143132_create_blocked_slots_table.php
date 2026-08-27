<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Blokir manual oleh Staff/Owner (maintenance, acara khusus) — Modul 04.
     * Overlap dicek di level aplikasi (bukan exclusion constraint DB seperti
     * bookings): blok dibuat oleh admin, bukan pelanggan yang berebut lewat
     * klik bersamaan, jadi risiko race condition jauh lebih kecil dan tidak
     * butuh jaminan atomik seketat itu.
     */
    public function up(): void
    {
        Schema::create('blocked_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->string('reason');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocked_slots');
    }
};
