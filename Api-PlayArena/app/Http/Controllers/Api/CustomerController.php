<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Modul 15 — basis pelanggan sisi Owner. Cuma pelanggan yang pernah booking
 * di venue milik owner login yang muncul di sini (bukan seluruh pelanggan
 * platform) — scoping yang sama seperti Modul 07/09, lewat venue_id owner.
 */
class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');

        $customers = User::query()
            ->whereHas('bookingsAsCustomer', fn ($q) => $q->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds)))
            ->withCount(['bookingsAsCustomer as bookings_count' => fn ($q) => $q->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds)),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'is_member']);

        $customers->each(fn ($customer) => $this->attachStats($customer, $venueIds));

        return response()->json(['data' => $customers]);
    }

    /** Riwayat booking pelanggan ini, dibatasi ke venue milik owner login. */
    public function show(Request $request, User $customer): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');
        abort_unless(
            $customer->bookingsAsCustomer()->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))->exists(),
            404,
            'Pelanggan ini belum pernah booking di venue Anda.'
        );

        $this->attachStats($customer, $venueIds);
        $customer->setRelation('bookings', $customer->bookingsAsCustomer()
            ->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))
            ->with(['court:id,name,venue_id', 'court.venue:id,name'])
            ->orderByDesc('starts_at')
            ->get(['id', 'court_id', 'starts_at', 'ends_at', 'status']));

        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, User $customer): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');
        abort_unless(
            $customer->bookingsAsCustomer()->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))->exists(),
            404,
            'Pelanggan ini belum pernah booking di venue Anda.'
        );

        $data = $request->validate(['is_member' => ['required', 'boolean']]);
        $customer->update($data);

        return response()->json(['data' => $customer->fresh()]);
    }

    private function attachStats(User $customer, Collection $venueIds): void
    {
        $customer->total_spent = Payment::where('status', 'paid')
            ->whereHas('booking', fn ($q) => $q->where('pelanggan_id', $customer->id)
                ->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))
            )
            ->sum('amount');

        $customer->last_booking_at = $customer->bookingsAsCustomer()
            ->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))
            ->max('starts_at');
    }
}
