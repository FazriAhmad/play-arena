<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 16 — promo & pengumuman, WEB SAJA untuk sekarang (bukan broadcast
 * WA/Email — lihat keputusan PRD). Owner buat pengumuman dengan target
 * segmen (semua/pernah booking venue tertentu/member); pelanggan cuma
 * lihat begitu mereka buka web sendiri, tidak ada yang didorong keluar.
 */
class AnnouncementController extends Controller
{
    /** Publik/opsional-auth — banner beranda & daftar pengumuman akun pelanggan, disaring sesuai segmen viewer. */
    public function active(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();

        $announcements = Announcement::where('is_active', true)
            ->with('venue:id,name')
            ->latest()
            ->get()
            ->filter(function (Announcement $a) use ($user) {
                if ($a->target_segment === 'all') {
                    return true;
                }
                if (! $user) {
                    return false;
                }
                if ($a->target_segment === 'member') {
                    return $user->is_member;
                }

                return Booking::where('pelanggan_id', $user->id)
                    ->whereHas('court', fn ($q) => $q->where('venue_id', $a->venue_id))
                    ->exists();
            })
            ->values();

        return response()->json(['data' => $announcements]);
    }

    public function index(Request $request): JsonResponse
    {
        $announcements = $request->user()->announcements()->with('venue:id,name')->latest()->get();

        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        if ($data['venue_id'] ?? null) {
            abort_unless($request->user()->ownedVenues()->whereKey($data['venue_id'])->exists(), 403, 'Bukan venue milik Anda.');
        }

        $announcement = $request->user()->announcements()->create($data);

        return response()->json(['data' => $announcement], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($announcement->owner_id === $request->user()->id, 403, 'Bukan pengumuman milik Anda.');
        $data = $this->validated($request, sometimes: true);
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }
        if (array_key_exists('venue_id', $data) && $data['venue_id']) {
            abort_unless($request->user()->ownedVenues()->whereKey($data['venue_id'])->exists(), 403, 'Bukan venue milik Anda.');
        }

        $announcement->update($data);

        return response()->json(['data' => $announcement->fresh()]);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($announcement->owner_id === $request->user()->id, 403, 'Bukan pengumuman milik Anda.');
        $announcement->delete();

        return response()->json(['data' => true]);
    }

    private function validated(Request $request, bool $sometimes = false): array
    {
        $rule = fn (string $r) => $sometimes ? ['sometimes', $r] : ['required', $r];

        return $request->validate([
            'title' => [...$rule('string'), 'max:255'],
            'body' => [...$rule('string'), 'max:2000'],
            'target_segment' => [...$rule('string'), 'in:all,venue,member'],
            'venue_id' => ['nullable', 'integer', 'exists:venues,id', 'required_if:target_segment,venue'],
        ]);
    }
}
