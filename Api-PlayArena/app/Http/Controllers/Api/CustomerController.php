<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Modul 15 — basis pelanggan sisi Owner. Cuma pelanggan yang pernah booking
 * di venue milik owner login ATAU yang sedang mengajukan permintaan member
 * (Modul 21, lewat web — lihat MembershipRequestController) yang muncul di
 * sini — bukan seluruh pelanggan platform.
 */
class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');

        $customers = User::query()
            ->where($this->visibilityScope($venueIds))
            ->withCount(['bookingsAsCustomer as bookings_count' => fn ($q) => $q->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds)),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'is_member', 'membership_expires_at', 'membership_requested_at']);

        $customers->each(fn ($customer) => $this->attachStats($customer, $venueIds));

        return response()->json(['data' => $customers]);
    }

    /** Riwayat booking pelanggan ini, dibatasi ke venue milik owner login. */
    public function show(Request $request, User $customer): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');
        abort_unless(
            User::where('id', $customer->id)->where($this->visibilityScope($venueIds))->exists(),
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
            User::where('id', $customer->id)->where($this->visibilityScope($venueIds))->exists(),
            404,
            'Pelanggan ini belum pernah booking di venue Anda.'
        );

        $data = $request->validate([
            'is_member' => ['sometimes', 'boolean'],
            // Tolak permintaan member (Modul 21) tanpa menjadikan member — beda dari is_member:false
            // yang mencabut member yang SUDAH aktif; ini buat permintaan yang belum pernah di-ACC.
            'reject_request' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('is_member', $data)) {
            // Modul 21 — jadi member selalu berarti "bayar 1 bulan penuh dari sekarang", bukan
            // cuma nyalain flag permanen. Nonaktifkan langsung mencabut hak diskon saat itu juga.
            $customer->is_member = $data['is_member'];
            $customer->membership_expires_at = $data['is_member'] ? now()->addMonth() : null;
            $customer->membership_requested_at = null;
        } elseif (! empty($data['reject_request'])) {
            $customer->membership_requested_at = null;
        }
        $customer->save();

        return response()->json(['data' => $customer->fresh()]);
    }

    /**
     * Pelanggan tetap terlihat kalau SALAH SATU: pernah booking, sedang
     * mengajukan permintaan member, ATAU sudah jadi member aktif — yang
     * terakhir ini penting supaya member yang di-ACC padahal belum pernah
     * booking (mis. langsung daftar member duluan) tidak hilang dari
     * daftar begitu `membership_requested_at` dikosongkan pas di-ACC.
     *
     * @return \Closure(Builder): void
     */
    private function visibilityScope(Collection $venueIds): \Closure
    {
        return fn (Builder $q) => $q
            ->whereHas('bookingsAsCustomer', fn ($b) => $b->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds)))
            ->orWhereNotNull('membership_requested_at')
            ->orWhere('is_member', true);
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
