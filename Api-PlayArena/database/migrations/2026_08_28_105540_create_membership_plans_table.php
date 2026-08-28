<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            // Satu plan per owner (bisnis satu pemilik multi-venue — bukan per venue,
            // sama seperti is_member yang juga global per pelanggan-owner, bukan per venue).
            $table->foreignId('owner_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('price');
            $table->unsignedTinyInteger('discount_percent');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
