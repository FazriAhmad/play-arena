<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourtController;
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

// Direktori publik (Modul 02) — tidak butuh login. "mine" harus terdaftar
// sebelum "{venue}" supaya tidak ditangkap sebagai route model binding.
Route::get('/venues/mine', [VenueController::class, 'mine'])->middleware('auth:sanctum');
Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{venue}', [VenueController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:owner')->group(function () {
        Route::post('/venues', [VenueController::class, 'store']);
        Route::post('/venues/{venue}/courts', [CourtController::class, 'store']);
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{staff}', [StaffController::class, 'update']);
    });
});
