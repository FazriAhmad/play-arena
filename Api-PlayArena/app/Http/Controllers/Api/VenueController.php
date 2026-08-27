<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Stub minimal untuk Modul 01 (dropdown penugasan staff butuh venue yang
 * sudah ada). CRUD lengkap — foto, fasilitas, jam operasional per hari,
 * dsb — dibangun di Modul 03.
 */
class VenueController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Venue::orderBy('name')->get(['id', 'name', 'city'])]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $venue = $request->user()->ownedVenues()->create($data);

        return response()->json(['data' => $venue], 201);
    }
}
