<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // shuttlecock_amount dihitung & dibekukan saat booking dibuat (qty x harga saat itu),
            // bukan dihitung ulang dari harga terbaru lapangan supaya tidak berubah kalau harga diedit belakangan.
            $table->unsignedInteger('shuttlecock_qty')->default(0)->after('discount_amount');
            $table->unsignedInteger('shuttlecock_amount')->default(0)->after('shuttlecock_qty');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['shuttlecock_qty', 'shuttlecock_amount']);
        });
    }
};
