<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            // Batal >= sekian jam sebelum jadwal = refund penuh; kurang dari itu = hangus (Modul 09).
            $table->unsignedSmallInteger('full_refund_hours')->default(24)->after('booking_hold_minutes');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('cancel_reason')->nullable()->after('reject_reason');
        });
    }

    public function down(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $table->dropColumn('full_refund_hours');
        });
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('cancel_reason');
        });
    }
};
