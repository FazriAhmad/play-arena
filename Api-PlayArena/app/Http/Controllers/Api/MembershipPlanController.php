<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 21 — plan membership bulanan. Satu plan per owner (bisnis satu
 * pemilik multi-venue, bukan per venue) — tampil sebagai satu form
 * "pengaturan", bukan daftar CRUD seperti Modul 14 (voucher bisa banyak
 * kode sekaligus, membership cuma satu tingkatan).
 */
class MembershipPlanController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->membershipPlan]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'price' => ['required', 'integer', 'min:0'],
            'discount_percent' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['required', 'boolean'],
            // Kuota booking badminton gratis (opsional) — dua-duanya wajib diisi bersamaan,
            // kosong berdua = member badminton cuma dapat diskon persen seperti sport lain.
            'badminton_quota_hours_per_week' => ['nullable', 'integer', 'min:1', 'max:168', 'required_with:badminton_quota_sessions_per_month'],
            'badminton_quota_sessions_per_month' => ['nullable', 'integer', 'min:1', 'max:31', 'required_with:badminton_quota_hours_per_week'],
        ]);

        $plan = MembershipPlan::updateOrCreate(['owner_id' => $request->user()->id], $data);

        return response()->json(['data' => $plan]);
    }
}
