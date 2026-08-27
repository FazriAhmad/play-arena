<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AuthorizesVenue;
use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** CRUD lapangan per venue (Modul 03) — nama, jenis olahraga, harga per jam, foto, fasilitas, aktif/nonaktifkan. Owner saja. */
class CourtController extends Controller
{
    use AuthorizesVenue;

    public function store(Request $request, Venue $venue): JsonResponse
    {
        $this->authorizeOwner($request->user(), $venue);
        $data = $this->validated($request);

        if ($request->hasFile('photo')) {
            $data['photo_url'] = Storage::disk('public')->url(
                $request->file('photo')->store('courts', 'public')
            );
        }

        $court = $venue->courts()->create($data + ['is_active' => true]);

        return response()->json(['data' => $court], 201);
    }

    public function update(Request $request, Court $court): JsonResponse
    {
        $this->authorizeOwner($request->user(), $court->venue);
        $data = $this->validated($request, sometimes: true);

        if ($request->hasFile('photo')) {
            if ($court->photo_url) {
                $oldPath = ltrim(str_replace('/storage/', '', parse_url($court->photo_url, PHP_URL_PATH)), '/');
                Storage::disk('public')->delete($oldPath);
            }
            $data['photo_url'] = Storage::disk('public')->url(
                $request->file('photo')->store('courts', 'public')
            );
        }

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $court->update($data);

        return response()->json(['data' => $court->fresh()]);
    }

    public function destroy(Request $request, Court $court): JsonResponse
    {
        $this->authorizeOwner($request->user(), $court->venue);
        $court->delete();

        return response()->json(['message' => 'Lapangan dihapus.']);
    }

    private function validated(Request $request, bool $sometimes = false): array
    {
        $rule = fn (string ...$r) => $sometimes ? ['sometimes', ...$r] : ['required', ...$r];

        return $request->validate([
            'name' => $rule('string', 'max:255'),
            'sport' => $rule('string', 'max:100'),
            'price_per_hour' => $rule('integer', 'min:0'),
            'photo' => ['nullable', 'image', 'max:5120'],
            'facilities' => ['nullable', 'array'],
        ]);
    }
}
