<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            // Nullable — cuma diisi kalau lapangan badminton menyediakan shuttlecock (dijual per buah).
            $table->unsignedInteger('shuttlecock_price')->nullable()->after('price_per_hour');
        });
    }

    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn('shuttlecock_price');
        });
    }
};
