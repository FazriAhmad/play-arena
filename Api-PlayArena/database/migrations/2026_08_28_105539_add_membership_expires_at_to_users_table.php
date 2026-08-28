<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Modul 21 — is_member (Modul 15) sekarang berjangka waktu, bukan permanen sampai
            // diubah manual. Null kalau bukan member / sudah expired & belum diperpanjang.
            $table->timestampTz('membership_expires_at')->nullable()->after('is_member');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('membership_expires_at');
        });
    }
};
