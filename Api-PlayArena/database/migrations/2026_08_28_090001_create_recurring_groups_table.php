<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pelanggan_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0 = Minggu .. 6 = Sabtu, konvensi Carbon::dayOfWeek
            $table->unsignedTinyInteger('start_hour');
            $table->unsignedTinyInteger('duration_hours');
            $table->date('starts_on');
            $table->date('ends_on')->nullable(); // salah satu dari ends_on / session_count wajib diisi
            $table->unsignedSmallInteger('session_count')->nullable();
            $table->string('contact_wa');
            $table->timestamps();
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('recurring_group_id')->nullable()->after('created_by')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_group_id');
        });
        Schema::dropIfExists('recurring_groups');
    }
};
