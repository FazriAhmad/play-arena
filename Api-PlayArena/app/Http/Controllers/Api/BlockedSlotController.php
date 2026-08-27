<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AuthorizesVenue;
use App\Http\Controllers\Controller;
use App\Models\BlockedSlot;
use App\Models\Booking;
use App\Models\Court;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Blokir slot manual (maintenance, acara khusus) — Modul 04. Owner atau
 * Staff yang ditugaskan ke venue lapangan ini.
 */
class BlockedSlotController extends Controller
{
    use AuthorizesVenue;

    public function index(Request $request, Court $court): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $court->venue);

        $blocks = $court->blockedSlots()
            ->where('ends_at', '>', now())
            ->orderBy('starts_at')
            ->get();

        return response()->json(['data' => $blocks]);
    }

    public function store(Request $request, Court $court): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $court->venue);

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'start_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $startsAt = Carbon::parse($data['date'], config('app.timezone'))->setTime($data['start_hour'], 0);
        $endsAt = $startsAt->copy()->addHours($data['duration_hours']);

        $overlapsBooking = $court->bookings()
            ->whereIn('status', Booking::ACTIVE_STATUSES)
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();
        abort_if($overlapsBooking, 422, 'Ada booking aktif di rentang waktu ini — batalkan/tunggu booking itu selesai dulu sebelum memblokir.');

        $overlapsBlock = $court->blockedSlots()
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();
        abort_if($overlapsBlock, 422, 'Rentang waktu ini sudah diblokir sebelumnya.');

        $block = $court->blockedSlots()->create([
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'reason' => $data['reason'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $block], 201);
    }

    public function destroy(Request $request, BlockedSlot $blockedSlot): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $blockedSlot->court->venue);
        $blockedSlot->delete();

        return response()->json(['message' => 'Blokir dihapus.']);
    }
}
