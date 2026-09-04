<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Log aktivitas Staff/Kasir &amp; Petugas Lapangan (2026-09-04, permintaan user
 * "admin bisa melihat log aktifitas dari petugas") — Owner saja, dan cuma
 * aktivitas di venue MILIK owner yang login (pola scoping sama seperti
 * Modul 15/19). Aksi owner sendiri ikut tercatat supaya riwayatnya utuh,
 * tapi bisa disaring lewat filter peran.
 */
class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');

        $request->validate([
            'venue_id' => ['nullable', 'integer'],
            'user_id' => ['nullable', 'integer'],
            'role' => ['nullable', 'in:owner,staff,petugas'],
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $logs = ActivityLog::query()
            ->whereIn('venue_id', $venueIds)
            ->when($request->filled('venue_id'), fn ($q) => $q->where('venue_id', $request->integer('venue_id')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('role'), fn ($q) => $q->where('user_role', $request->string('role')))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('created_at', $request->string('date')))
            ->with('venue:id,name')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json(['data' => $logs]);
    }
}
