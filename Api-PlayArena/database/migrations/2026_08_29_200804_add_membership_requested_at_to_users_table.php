<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Permintaan jadi member LEWAT WEB (bukan WA) — pelanggan ajukan, admin ACC/tolak dari
            // Kelola Pelanggan. Non-null = ada permintaan menunggu diproses; cuma dicabut kalau
            // admin ACC (jadi member) atau tolak eksplisit, TIDAK auto-expire seperti booking.
            $table->timestampTz('membership_requested_at')->nullable()->after('membership_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('membership_requested_at');
        });
    }
};
