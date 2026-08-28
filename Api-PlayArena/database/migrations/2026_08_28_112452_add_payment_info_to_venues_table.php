<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            // Pengganti sementara Midtrans (Modul 06 masih ditunda) — pelanggan transfer
            // manual ke rekening/QRIS ini, admin ACC setelah cek mutasi (ManageBookingController::confirmPayment,
            // sudah ada sejak Modul 07, tidak berubah). Semua nullable — venue boleh belum isi salah satu/keduanya.
            $table->string('bank_name')->nullable()->after('admin_wa');
            $table->string('bank_account_number')->nullable()->after('bank_name');
            $table->string('bank_account_holder')->nullable()->after('bank_account_number');
            $table->string('qris_image_url')->nullable()->after('bank_account_holder');
        });
    }

    public function down(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'bank_account_number', 'bank_account_holder', 'qris_image_url']);
        });
    }
};
