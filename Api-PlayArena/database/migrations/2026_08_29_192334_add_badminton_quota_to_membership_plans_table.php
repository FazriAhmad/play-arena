<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            // Kuota booking badminton GRATIS termasuk biaya member (beda dari discount_percent
            // yang berlaku ke semua sport) — nullable, kosong = member badminton cuma dapat
            // diskon persen biasa seperti sport lain, tanpa kuota gratis.
            $table->unsignedTinyInteger('badminton_quota_hours_per_week')->nullable();
            $table->unsignedTinyInteger('badminton_quota_sessions_per_month')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->dropColumn(['badminton_quota_hours_per_week', 'badminton_quota_sessions_per_month']);
        });
    }
};
