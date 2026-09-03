<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password as PasswordRule;

/**
 * Kelola akun Staff/Kasir & Petugas Lapangan — cuma Owner. Keduanya tidak
 * bisa mendaftar sendiri (beda dari Pelanggan di AuthController::register),
 * dan sama-sama ditugaskan ke satu atau lebih venue lewat venue_staff.
 *
 * Beda keduanya cuma di akses menu (lihat AdminLayout &amp; guard route):
 * `staff` boleh buka Analitik, `petugas` tidak — keuangan (Laporan
 * Pendapatan) tetap Owner-only untuk dua-duanya.
 */
class StaffController extends Controller
{
    /** Role yang boleh dibuat lewat halaman ini — owner &amp; pelanggan sengaja tidak termasuk. */
    private const MANAGED_ROLES = ['staff', 'petugas'];

    public function index(): JsonResponse
    {
        $staff = User::role(self::MANAGED_ROLES)
            ->with('venues:id,name', 'roles:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'is_active']);

        return response()->json(['data' => $staff]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
            'role' => ['required', 'in:'.implode(',', self::MANAGED_ROLES)],
            'venue_ids' => ['required', 'array', 'min:1'],
            'venue_ids.*' => ['integer', 'exists:venues,id'],
        ]);

        $staff = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => $data['password'],
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $staff->assignRole($data['role']);
        $staff->venues()->sync($data['venue_ids']);

        return response()->json(['data' => $staff->load('venues:id,name', 'roles:id,name')], 201);
    }

    public function update(Request $request, User $staff): JsonResponse
    {
        abort_unless($staff->hasAnyRole(self::MANAGED_ROLES), 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30', 'unique:users,phone,'.$staff->id],
            'is_active' => ['sometimes', 'boolean'],
            'role' => ['sometimes', 'in:'.implode(',', self::MANAGED_ROLES)],
            'venue_ids' => ['sometimes', 'array', 'min:1'],
            'venue_ids.*' => ['integer', 'exists:venues,id'],
        ]);

        $staff->update(collect($data)->except(['venue_ids', 'role'])->toArray());

        if (isset($data['role'])) {
            $staff->syncRoles([$data['role']]);
        }

        if (isset($data['venue_ids'])) {
            $staff->venues()->sync($data['venue_ids']);
        }

        return response()->json(['data' => $staff->fresh()->load('venues:id,name', 'roles:id,name')]);
    }
}
