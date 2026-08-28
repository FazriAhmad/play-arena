<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Terpisah dari discount_amount (voucher, Modul 14) supaya invoice bisa
            // menampilkan dua baris berbeda — diskon voucher & diskon member berdiri sendiri.
            $table->unsignedInteger('member_discount_amount')->default(0)->after('shuttlecock_amount');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('member_discount_amount');
        });
    }
};
