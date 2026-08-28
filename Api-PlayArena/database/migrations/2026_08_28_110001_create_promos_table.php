<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            // Nullable = berlaku semua venue milik owner ini.
            $table->foreignId('venue_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('discount_type'); // percent | fixed
            $table->unsignedInteger('value');
            $table->unsignedInteger('min_amount')->nullable();
            $table->unsignedInteger('quota')->nullable(); // null = tanpa batas
            $table->unsignedInteger('used_count')->default(0);
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('promo_code')->nullable()->after('contact_wa');
            $table->unsignedInteger('discount_amount')->nullable()->after('promo_code');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['promo_code', 'discount_amount']);
        });
        Schema::dropIfExists('promos');
    }
};
