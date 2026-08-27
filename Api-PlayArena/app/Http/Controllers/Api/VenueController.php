<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 02 (direktori publik) & stub Modul 01 (dropdown penugasan staff).
 * CRUD lengkap venue — fasilitas, jam operasional per hari, dsb — dibangun
 * di Modul 03.
 */
class VenueController extends Controller
{
    /** Direktori publik — filter jenis olahraga, kota, rentang harga (PRD Modul 02). */
    public function index(Request $request): JsonResponse
    {
        $venues = Venue::query()
            ->where('is_active', true)
            ->with(['courts' => fn ($q) => $q->where('is_active', true)->orderBy('id')])
            ->when($request->filled('city'), fn ($q) => $q->where('city', 'ilike', '%'.$request->string('city').'%'))
            ->when($request->filled('sport'), function ($q) use ($request) {
                $q->whereHas('courts', fn ($c) => $c->where('is_active', true)->where('sport', $request->string('sport')));
            })
            ->when($request->filled('min_price'), function ($q) use ($request) {
                $q->whereHas('courts', fn ($c) => $c->where('is_active', true)->where('price_per_hour', '>=', $request->integer('min_price')));
            })
            ->when($request->filled('max_price'), function ($q) use ($request) {
                $q->whereHas('courts', fn ($c) => $c->where('is_active', true)->where('price_per_hour', '<=', $request->integer('max_price')));
            })
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $venues->map($this->summarize(...))]);
    }

    /** Detail venue publik + daftar lapangan aktifnya. */
    public function show(Venue $venue): JsonResponse
    {
        abort_unless($venue->is_active, 404);
        $venue->load(['courts' => fn ($q) => $q->where('is_active', true)->orderBy('name')]);

        return response()->json(['data' => [
            'id' => $venue->id,
            'name' => $venue->name,
            'city' => $venue->city,
            'address' => $venue->address,
            'lat' => $venue->lat,
            'lng' => $venue->lng,
            'open_hour' => $venue->open_hour,
            'close_hour' => $venue->close_hour,
            'courts' => $venue->courts,
        ]]);
    }

    /** Dropdown venue milik sendiri — dipakai form penugasan staff (Modul 01). */
    public function mine(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->ownedVenues()->orderBy('name')->get(['id', 'name', 'city'])]);
    }

    /** Daftar venue milik sendiri untuk dikelola — termasuk yang nonaktif, beda dari direktori publik. */
    public function ownerIndex(Request $request): JsonResponse
    {
        $venues = $request->user()->ownedVenues()->withCount('courts')->orderBy('name')->get();

        return response()->json(['data' => $venues]);
    }

    /** Detail venue milik sendiri untuk form edit — semua lapangan, termasuk yang nonaktif. */
    public function ownerShow(Request $request, Venue $venue): JsonResponse
    {
        $this->authorizeOwner($request, $venue);
        $venue->load(['courts' => fn ($q) => $q->orderBy('name')]);

        return response()->json(['data' => $venue]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $venue = $request->user()->ownedVenues()->create($data + ['is_active' => true]);

        return response()->json(['data' => $venue], 201);
    }

    public function update(Request $request, Venue $venue): JsonResponse
    {
        $this->authorizeOwner($request, $venue);
        $data = $this->validated($request, sometimes: true);
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }
        $venue->update($data);

        return response()->json(['data' => $venue->fresh()]);
    }

    private function validated(Request $request, bool $sometimes = false): array
    {
        $rule = fn (string $r) => $sometimes ? ['sometimes', $r] : ['required', $r];

        return $request->validate([
            'name' => [...$rule('string'), 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'open_hour' => ['nullable', 'integer', 'min:0', 'max:23'],
            'close_hour' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);
    }

    private function authorizeOwner(Request $request, Venue $venue): void
    {
        abort_unless($venue->owner_id === $request->user()->id, 403, 'Bukan venue milik Anda.');
    }

    private function summarize(Venue $venue): array
    {
        $activeCourts = $venue->courts;

        return [
            'id' => $venue->id,
            'name' => $venue->name,
            'city' => $venue->city,
            'cover' => $activeCourts->first(fn ($c) => $c->photo_url !== null)?->photo_url,
            'sports' => $activeCourts->pluck('sport')->unique()->values(),
            'price_from' => $activeCourts->min('price_per_hour'),
            'courts_count' => $activeCourts->count(),
        ];
    }
}
