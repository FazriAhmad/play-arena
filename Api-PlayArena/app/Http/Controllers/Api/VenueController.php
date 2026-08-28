<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AuthorizesVenue;
use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Direktori publik (Modul 02) & CRUD venue (Modul 03). Endpoint "manage/*"
 * dipakai Owner (CRUD penuh) maupun Staff (lihat + kelola kalender/blokir
 * slot di Modul 04) — dibedakan lewat AuthorizesVenue, bukan lewat route
 * middleware role terpisah, karena kombinasi aksesnya beririsan.
 */
class VenueController extends Controller
{
    use AuthorizesVenue;

    /** Direktori publik — filter jenis olahraga, kota, rentang harga (PRD Modul 02). */
    public function index(Request $request): JsonResponse
    {
        $venues = Venue::query()
            ->where('is_active', true)
            ->with(['courts' => fn ($q) => $q->where('is_active', true)->withAvg('reviews', 'rating')->withCount('reviews')->orderBy('id')])
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
        $venue->load(['courts' => fn ($q) => $q->where('is_active', true)->withAvg('reviews', 'rating')->withCount('reviews')->orderBy('name'), 'owner.membershipPlan']);

        $plan = $venue->owner->membershipPlan;

        return response()->json(['data' => [
            'id' => $venue->id,
            'name' => $venue->name,
            'city' => $venue->city,
            'address' => $venue->address,
            'admin_wa' => $venue->admin_wa,
            'lat' => $venue->lat,
            'lng' => $venue->lng,
            'open_hour' => $venue->open_hour,
            'close_hour' => $venue->close_hour,
            'courts' => $venue->courts,
            // Modul 21 — cuma dikirim kalau owner venue ini punya plan aktif, dipakai
            // tampilkan pitch member + hitung estimasi diskon di sisi frontend.
            'membership' => $plan?->is_active ? ['price' => $plan->price, 'discount_percent' => $plan->discount_percent] : null,
        ]]);
    }

    /** Dropdown venue milik sendiri — dipakai form penugasan staff (Modul 01). */
    public function mine(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->ownedVenues()->orderBy('name')->get(['id', 'name', 'city'])]);
    }

    /**
     * Daftar venue yang bisa dikelola user login — Owner lihat semua venue
     * miliknya, Staff lihat venue tempat dia ditugaskan. Termasuk yang
     * nonaktif, beda dari direktori publik.
     */
    public function manageIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        $venues = $user->hasRole('owner')
            ? $user->ownedVenues()->withCount('courts')->orderBy('name')->get()
            : $user->venues()->withCount('courts')->orderBy('name')->get();

        return response()->json(['data' => $venues]);
    }

    /** Detail venue untuk dikelola — semua lapangan termasuk yang nonaktif. Owner atau staff venue ini. */
    public function manageShow(Request $request, Venue $venue): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $venue);
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
        $this->authorizeOwner($request->user(), $venue);
        $data = $this->validated($request, sometimes: true);
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }
        $venue->update($data);

        return response()->json(['data' => $venue->fresh()]);
    }

    /**
     * Modul 06 (sementara, sambil menunggu Midtrans sandbox key) — QRIS milik
     * venue, dipakai pelanggan transfer manual, di-ACC admin lewat
     * ManageBookingController::confirmPayment yang sudah ada (Modul 07).
     * Endpoint terpisah dari `update()` karena PHP tidak parse file upload
     * di request PUT multipart — pola yang sama seperti foto lapangan (Modul 03).
     */
    public function uploadQris(Request $request, Venue $venue): JsonResponse
    {
        $this->authorizeOwner($request->user(), $venue);
        $request->validate(['qris' => ['required', 'image', 'max:5120']]);

        if ($venue->qris_image_url) {
            $oldPath = ltrim(str_replace('/storage/', '', parse_url($venue->qris_image_url, PHP_URL_PATH)), '/');
            Storage::disk('public')->delete($oldPath);
        }

        $venue->update([
            'qris_image_url' => Storage::disk('public')->url(
                $request->file('qris')->store('qris', 'public')
            ),
        ]);

        return response()->json(['data' => $venue->fresh()]);
    }

    private function validated(Request $request, bool $sometimes = false): array
    {
        $rule = fn (string $r) => $sometimes ? ['sometimes', $r] : ['required', $r];

        return $request->validate([
            'name' => [...$rule('string'), 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'admin_wa' => ['nullable', 'string', 'max:30'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:50'],
            'bank_account_holder' => ['nullable', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'open_hour' => ['nullable', 'integer', 'min:0', 'max:23'],
            'close_hour' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);
    }

    private function summarize(Venue $venue): array
    {
        $activeCourts = $venue->courts;
        $reviewsCount = (int) $activeCourts->sum('reviews_count');

        return [
            'id' => $venue->id,
            'name' => $venue->name,
            'city' => $venue->city,
            'cover' => $activeCourts->first(fn ($c) => $c->photo_url !== null)?->photo_url,
            'sports' => $activeCourts->pluck('sport')->unique()->values(),
            'price_from' => $activeCourts->min('price_per_hour'),
            'courts_count' => $activeCourts->count(),
            'rating_avg' => $reviewsCount > 0
                ? round($activeCourts->sum(fn ($c) => $c->reviews_avg_rating * $c->reviews_count) / $reviewsCount, 1)
                : null,
            'reviews_count' => $reviewsCount,
        ];
    }
}
