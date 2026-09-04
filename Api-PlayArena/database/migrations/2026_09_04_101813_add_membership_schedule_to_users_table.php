<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Jadwal tetap mingguan yang dipilih pelanggan saat mengajukan member
            // (keputusan user 2026-09-04: "member dapat waktu & jam yang sama tiap
            // minggu selama 1 bulan"). Diisi saat mengajukan, TETAP disimpan setelah
            // di-ACC supaya bisa dipakai ulang waktu perpanjang bulan berikutnya.
            $table->foreignId('membership_court_id')->nullable()->after('membership_requested_at')->constrained('courts')->nullOnDelete();
            $table->unsignedTinyInteger('membership_day_of_week')->nullable()->after('membership_court_id'); // 0=Minggu (konvensi Carbon)
            $table->unsignedTinyInteger('membership_start_hour')->nullable()->after('membership_day_of_week');
            $table->unsignedTinyInteger('membership_duration_hours')->nullable()->after('membership_start_hour');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('membership_court_id');
            $table->dropColumn(['membership_day_of_week', 'membership_start_hour', 'membership_duration_hours']);
        });
    }
};
