<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            // Pelaku aksi. nullOnDelete supaya jejak aktivitas TIDAK ikut hilang
            // kalau akun staff/petugasnya dihapus — justru itu yang mau diaudit.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // Disalin saat pencatatan supaya nama pelaku tetap terbaca walau akunnya dihapus.
            $table->string('user_name');
            $table->string('user_role');
            $table->foreignId('venue_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('description');
            $table->timestamps();

            $table->index(['venue_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
