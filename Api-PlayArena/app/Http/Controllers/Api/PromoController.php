<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AppliesPromoCode;
use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\Promo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Modul 14 — voucher & kode promo. CRUD Owner-only; validasi publik lewat preview(). */
class PromoController extends Controller
{
    use AppliesPromoCode;

    public function index(Request $request): JsonResponse
    {
        $promos = $request->user()->promos()->with('venue:id,name')->latest()->get();

        return response()->json(['data' => $promos]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->filled('code')) {
            $request->merge(['code' => mb_strtoupper($request->string('code'))]);
        }
        $data = $this->validated($request, sometimes: false);

        if ($data['venue_id'] ?? null) {
            abort_unless($request->user()->ownedVenues()->whereKey($data['venue_id'])->exists(), 403, 'Bukan venue milik Anda.');
        }

        $promo = $request->user()->promos()->create($data);

        return response()->json(['data' => $promo], 201);
    }

    public function update(Request $request, Promo $promo): JsonResponse
    {
        abort_unless($promo->owner_id === $request->user()->id, 403, 'Bukan voucher milik Anda.');
        if ($request->filled('code')) {
            $request->merge(['code' => mb_strtoupper($request->string('code'))]);
        }
        $data = $this->validated($request, sometimes: true, ignorePromoId: $promo->id);
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }
        if (array_key_exists('venue_id', $data) && $data['venue_id']) {
            abort_unless($request->user()->ownedVenues()->whereKey($data['venue_id'])->exists(), 403, 'Bukan venue milik Anda.');
        }

        $promo->update($data);

        return response()->json(['data' => $promo->fresh()]);
    }

    public function destroy(Request $request, Promo $promo): JsonResponse
    {
        abort_unless($promo->owner_id === $request->user()->id, 403, 'Bukan voucher milik Anda.');
        $promo->delete();

        return response()->json(['data' => true]);
    }

    /** Publik — cek voucher sebelum booking, dipakai form booking pelanggan. */
    public function preview(Request $request, Court $court): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $amount = $court->price_per_hour * $data['duration_hours'];
        $result = $this->resolvePromo($data['code'], $court, $amount);

        return response()->json(['data' => [
            'discount_amount' => $result['discount'],
            'final_amount' => $amount - $result['discount'],
        ]]);
    }

    private function validated(Request $request, bool $sometimes = false, ?int $ignorePromoId = null): array
    {
        $rule = fn (string $r) => $sometimes ? ['sometimes', $r] : ['required', $r];
        $uniqueCode = 'unique:promos,code'.($ignorePromoId ? ','.$ignorePromoId : '');

        return $request->validate([
            'venue_id' => ['nullable', 'integer', 'exists:venues,id'],
            'code' => [...$rule('string'), 'max:50', 'alpha_dash', $uniqueCode],
            'discount_type' => [...$rule('string'), 'in:percent,fixed'],
            'value' => [...$rule('integer'), 'min:1'],
            'min_amount' => ['nullable', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:1'],
            'starts_at' => $rule('date'),
            'ends_at' => [...$rule('date'), 'after:starts_at'],
        ]);
    }
}
