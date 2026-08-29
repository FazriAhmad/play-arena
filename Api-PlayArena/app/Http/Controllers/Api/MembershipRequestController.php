<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 21 — pendaftaran member LEWAT WEB (keputusan user 2026-08-29: bukan
 * WA lagi), admin ACC/tolak dari Kelola Pelanggan (`CustomerController`).
 * Pola sama seperti booking: pelanggan ajukan → menunggu → admin proses.
 */
class MembershipRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_if($user->is_member && $user->membership_expires_at?->isFuture(), 422, 'Anda sudah member aktif.');
        abort_if($user->membership_requested_at, 422, 'Permintaan Anda sudah menunggu diproses admin.');

        $user->update(['membership_requested_at' => now()]);

        return response()->json(['data' => ['membership_requested_at' => $user->membership_requested_at]]);
    }
}
