<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Stub minimal (owner bikin lapangan di venue miliknya) — cukup supaya
 * Modul 02 (direktori publik) punya data nyata untuk dicari. Form
 * pengelolaan lengkap (foto, fasilitas terstruktur, dsb) dibangun di Modul 03.
 */
class CourtController extends Controller
{
    public function store(Request $request, Venue $venue): JsonResponse
    {
        abort_unless($venue->owner_id === $request->user()->id, 403, 'Bukan venue milik Anda.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sport' => ['required', 'string', 'max:100'],
            'price_per_hour' => ['required', 'integer', 'min:0'],
            'photo_url' => ['nullable', 'string', 'max:255'],
            'facilities' => ['nullable', 'array'],
        ]);

        $court = $venue->courts()->create($data + ['is_active' => true]);

        return response()->json(['data' => $court], 201);
    }
}
