<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockedSlotController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CourtController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ManageBookingController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\RecurringBookingController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SlotController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\VenueController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['ok' => true, 'app' => config('app.name')]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Direktori & kalender publik (Modul 02 & 04) — tidak butuh login. "mine"
// harus terdaftar sebelum "{venue}" supaya tidak ditangkap sebagai route
// model binding.
Route::get('/venues/mine', [VenueController::class, 'mine'])->middleware('auth:sanctum');
Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{venue}', [VenueController::class, 'show']);
Route::get('/courts/{court}/slots', [SlotController::class, 'index']);
Route::get('/courts/{court}/reviews', [ReviewController::class, 'index']);
Route::post('/courts/{court}/promos/preview', [PromoController::class, 'preview']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Modul 05 — booking pelanggan. Terbuka untuk siapa pun yang login,
    // tidak dibatasi role:pelanggan supaya owner/staff juga bisa coba pesan
    // buat dirinya sendiri tanpa perlu akun kedua.
    Route::post('/courts/{court}/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/mine', [BookingController::class, 'mine']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);

    // Modul 09 — cancel & reschedule oleh pelanggan sendiri.
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/reschedule', [BookingController::class, 'reschedule']);

    // Modul 11 — booking berulang, sama seperti Modul 05 tidak dibatasi role:pelanggan.
    Route::post('/courts/{court}/recurring-bookings', [RecurringBookingController::class, 'store']);

    // Modul 13 — rating & review, cuma pemilik booking completed.
    Route::post('/bookings/{booking}/review', [ReviewController::class, 'store']);

    // Modul 04 — kalender & blokir slot. Owner ATAU staff yang ditugaskan
    // ke venue tsb (dicek di controller, bukan middleware role, karena
    // aksesnya beririsan antara dua peran).
    Route::get('/manage/venues', [VenueController::class, 'manageIndex']);
    Route::get('/manage/venues/{venue}', [VenueController::class, 'manageShow']);
    Route::get('/manage/courts/{court}/blocked-slots', [BlockedSlotController::class, 'index']);
    Route::post('/manage/courts/{court}/blocked-slots', [BlockedSlotController::class, 'store']);
    Route::delete('/manage/blocked-slots/{blockedSlot}', [BlockedSlotController::class, 'destroy']);

    // Modul 07 — kelola booking masuk. Owner ATAU staff venue terkait
    // (dicek di controller lewat AuthorizesVenue, sama seperti Modul 04).
    Route::get('/manage/bookings', [ManageBookingController::class, 'index']);
    Route::post('/manage/bookings/{booking}/accept', [ManageBookingController::class, 'accept']);
    Route::post('/manage/bookings/{booking}/reject', [ManageBookingController::class, 'reject']);
    Route::post('/manage/bookings/{booking}/confirm-payment', [ManageBookingController::class, 'confirmPayment']);
    Route::post('/manage/bookings/{booking}/cancel', [ManageBookingController::class, 'cancel']);
    Route::post('/manage/courts/{court}/bookings/walk-in', [ManageBookingController::class, 'walkIn']);

    Route::middleware('role:owner')->group(function () {
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{staff}', [StaffController::class, 'update']);

        // Modul 03 — CRUD data lapangan, Owner saja (Staff cuma boleh kelola
        // kalender/blokir slot, bukan ubah data master venue/lapangan).
        Route::post('/manage/venues', [VenueController::class, 'store']);
        Route::put('/manage/venues/{venue}', [VenueController::class, 'update']);
        Route::post('/manage/venues/{venue}/courts', [CourtController::class, 'store']);
        Route::post('/manage/courts/{court}', [CourtController::class, 'update']);
        Route::delete('/manage/courts/{court}', [CourtController::class, 'destroy']);

        // Modul 14 — voucher & kode promo, Owner saja (keputusan pemasaran, bukan operasional harian Staff).
        Route::get('/manage/promos', [PromoController::class, 'index']);
        Route::post('/manage/promos', [PromoController::class, 'store']);
        Route::put('/manage/promos/{promo}', [PromoController::class, 'update']);
        Route::delete('/manage/promos/{promo}', [PromoController::class, 'destroy']);

        // Modul 15 — kelola pelanggan/member, Owner saja (lihat basis pelanggannya sendiri).
        Route::get('/manage/customers', [CustomerController::class, 'index']);
        Route::get('/manage/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/manage/customers/{customer}', [CustomerController::class, 'update']);
    });
});
