<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw ALTER (bukan ->change()) supaya tidak butuh doctrine/dbal.
        DB::statement('ALTER TABLE bookings ALTER COLUMN pelanggan_id DROP NOT NULL');

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('guest_name')->nullable()->after('pelanggan_id');
            $table->string('reject_reason')->nullable()->after('status');
            $table->foreignId('created_by')->nullable()->after('reject_reason')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['guest_name', 'reject_reason']);
        });
        DB::statement('ALTER TABLE bookings ALTER COLUMN pelanggan_id SET NOT NULL');
    }
};
